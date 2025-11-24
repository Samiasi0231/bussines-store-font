import { Logger } from '@nestjs/common';

/**
 * Retry configuration for database operations
 */
export interface DbRetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Determines if an error is a transient database error that should be retried
 */
export function isTransientDbError(error: any): boolean {
  const code = error?.code || error?.driverError?.code;
  const message = error?.message || error?.driverError?.message || '';

  // PostgreSQL error codes for transient errors
  const transientErrorCodes = [
    '40001', // serialization_failure
    '40P01', // deadlock_detected
    '08003', // connection_does_not_exist
    '08006', // connection_failure
    '08001', // sqlclient_unable_to_establish_sqlconnection
    '08004', // sqlserver_rejected_establishment_of_sqlconnection
    '57P03', // cannot_connect_now
    '53300', // too_many_connections
  ];

  // Network/connection errors
  const transientErrorMessages = [
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'Connection terminated',
    'Connection lost',
    'Connection closed',
    'Connection timeout',
    'Query read timeout',
  ];

  return (
    transientErrorCodes.includes(code) ||
    transientErrorMessages.some((msg) =>
      message.toLowerCase().includes(msg.toLowerCase()),
    )
  );
}

/**
 * Executes a database operation with retry logic for transient errors
 * Uses exponential backoff with jitter to prevent thundering herd
 *
 * @param fn - The database operation to execute
 * @param options - Retry configuration options
 * @returns The result of the database operation
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withDbRetry(
 *   () => this.userRepository.save(user),
 *   { maxRetries: 3, baseDelayMs: 100 }
 * );
 * ```
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  options: DbRetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 5,
    baseDelayMs = 100,
    maxDelayMs = 10000,
    onRetry,
  } = options;

  const logger = new Logger('DbRetry');
  let attempt = 0;
  let lastError: any;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's not a transient error or we've exhausted retries
      if (attempt >= maxRetries || !isTransientDbError(error)) {
        throw error;
      }

      // Calculate exponential backoff with jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 100); // 0-100ms random jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      attempt++;

      if (onRetry) {
        onRetry(attempt, error);
      } else {
        logger.warn(
          `Transient database error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
          error?.message || error,
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

