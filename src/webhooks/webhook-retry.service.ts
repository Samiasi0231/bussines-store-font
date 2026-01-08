import { Injectable, Logger } from '@nestjs/common';
import { WebhookEventService } from './webhook-event.service';
import { UUID } from 'crypto';

@Injectable()
export class WebhookRetryService {
  private readonly logger = new Logger(WebhookRetryService.name);

  constructor(private readonly webhookEventService: WebhookEventService) {}

  /**
   * Execute function with retry mechanism
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    eventId?: UUID,
    operationName?: string,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log({
          message: `Executing ${operationName}`,
          eventId,
          attempt,
          maxRetries,
        });

        const result = await fn();

        if (attempt > 1) {
          this.logger.log({
            message: `${operationName} succeeded after retry`,
            eventId,
            attempt,
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        this.logger.error({
          message: `${operationName} attempt ${attempt} failed`,
          eventId,
          attempt,
          error: error.message,
        });

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          this.logger.log({
            message: `Retrying ${operationName} in ${delay}ms`,
            eventId,
            attempt,
            nextAttempt: attempt + 1,
          });

          await this.sleep(delay);
        }
      }
    }

    this.logger.error({
      message: `${operationName} failed after ${maxRetries} attempts`,
      eventId,
      error: lastError.message,
    });

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
