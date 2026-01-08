import { Injectable } from '@nestjs/common';
import { TransactionLogRepository } from '../repositories/transaction-log.repository';
import { UUID } from 'crypto';
import { TransactionLog } from '../entities/transaction-log.entity';

export interface CreateTransactionLogParams {
  transactionId?: UUID;
  entityId?: UUID;
  entityType?: string;
  status?: string;
  amount?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TransactionLogService {
  constructor(
    private readonly transactionLogRepository: TransactionLogRepository,
  ) {}

  /**
   * Create a transaction log entry
   */
  async createLog(params: CreateTransactionLogParams): Promise<TransactionLog> {
    const log = this.transactionLogRepository.create({
      transactionId: params.transactionId,
      entityId: params.entityId,
      entityType: params.entityType,
      status: params.status,
      amount: params.amount,
      message: params.message,
      metadata: params.metadata || {},
    });

    return this.transactionLogRepository.save(log);
  }

  /**
   * Log entity changes (for use by entity subscribers)
   */
  async logEntityChange(
    entityId: UUID,
    entityType: string,
    transactionId: UUID | undefined,
    action: 'create' | 'update' | 'delete',
    changes?: Record<string, unknown>,
    status?: string,
    amount?: number,
    transactionStatus?: string,
  ): Promise<TransactionLog> {
    const message = `Entity ${entityType} ${action}d`;
    
    const metadata: Record<string, unknown> = {
      action,
      changes: changes || {},
    };

    // Include Transaction status if provided
    if (transactionStatus) {
      metadata.transactionStatus = transactionStatus;
    }
    
    return this.createLog({
      transactionId,
      entityId,
      entityType,
      status: status || action,
      amount,
      message,
      metadata,
    });
  }

  /**
   * Get logs for a specific transaction
   */
  async getLogsByTransactionId(
    transactionId: UUID,
  ): Promise<TransactionLog[]> {
    return this.transactionLogRepository.find({
      where: { transactionId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get logs for a specific entity
   */
  async getLogsByEntity(
    entityId: UUID,
    entityType?: string,
  ): Promise<TransactionLog[]> {
    const where: any = { entityId };
    if (entityType) {
      where.entityType = entityType;
    }

    return this.transactionLogRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }
}

