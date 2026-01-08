import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { TransactionLogService } from '../transaction-log.service';

@EventSubscriber()
export class TransactionSubscriber
  implements EntitySubscriberInterface<Transaction>
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionLogService: TransactionLogService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Transaction;
  }

  async afterInsert(event: InsertEvent<Transaction>): Promise<void> {
    const transaction = event.entity;

    if (!transaction || !transaction.id) {
      return;
    }

    // Defer logging to next event loop tick to avoid blocking and connection pool issues
    setImmediate(async () => {
      try {
        await this.transactionLogService.logEntityChange(
          transaction.id!,
          'Transaction',
          transaction.id,
          'create',
          {
            status: transaction.status,
            type: transaction.type,
            amount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            reference: transaction.reference,
            channel: transaction.channel,
            purpose: transaction.purpose,
          },
          transaction.status,
          transaction.amount,
          transaction.status,
        );
      } catch (error) {
        // Log error but don't throw - we don't want to break the main transaction
        console.error('Error logging transaction creation:', error);
      }
    });
  }

  async afterUpdate(event: UpdateEvent<Transaction>): Promise<void> {
    const transaction = event.entity as Transaction;

    if (!transaction || !transaction.id) {
      return;
    }

    // Defer logging to next event loop tick to avoid blocking and connection pool issues
    setImmediate(async () => {
      try {
        // Get changed columns
        const changedColumns = event.updatedColumns.map((col) => col.propertyName);
        const changes: Record<string, unknown> = {};

        changedColumns.forEach((column) => {
          if (
            event.databaseEntity &&
            transaction[column as keyof Transaction] !== undefined
          ) {
            changes[column] = {
              old: event.databaseEntity[column as keyof Transaction],
              new: transaction[column as keyof Transaction],
            };
          }
        });

        // Get status: use new value if it was updated, otherwise use database value
        const statusUpdated = changedColumns.includes('status');
        const status = statusUpdated
          ? transaction.status
          : event.databaseEntity?.status || transaction.status;

        await this.transactionLogService.logEntityChange(
          transaction.id!,
          'Transaction',
          transaction.id,
          'update',
          changes,
          status,
          transaction.amount,
          status,
        );
      } catch (error) {
        // Log error but don't throw - we don't want to break the main transaction
        console.error('Error logging transaction update:', error);
      }
    });
  }
}

