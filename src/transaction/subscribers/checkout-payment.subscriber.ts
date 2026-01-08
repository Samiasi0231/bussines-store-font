import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CheckoutPayment } from '../../entities/checkout-payment.entity';
import { Transaction } from '../../entities/transaction.entity';
import { TransactionLogService } from '../transaction-log.service';

@EventSubscriber()
export class CheckoutPaymentSubscriber
  implements EntitySubscriberInterface<CheckoutPayment>
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionLogService: TransactionLogService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return CheckoutPayment;
  }

  async afterInsert(event: InsertEvent<CheckoutPayment>): Promise<void> {
    const checkoutPayment = event.entity;
    
    if (!checkoutPayment || !checkoutPayment.id) {
      return;
    }

    // Defer logging to next event loop tick to avoid blocking and connection pool issues
    setImmediate(async () => {
      try {
        // Query the database to get the actual saved entity with transactionId
        const savedCheckoutPayment = await this.dataSource
          .getRepository(CheckoutPayment)
          .findOne({ 
            where: { id: checkoutPayment.id }, 
            select: ['id', 'transactionId', 'status', 'provider', 'intent', 'reference', 'amount'] 
          });

        const transactionId = savedCheckoutPayment?.transactionId || checkoutPayment.transactionId;

        // Query Transaction entity to get its current status
        let transactionStatus: string | undefined;
        if (transactionId) {
          const transaction = await this.dataSource
            .getRepository(Transaction)
            .findOne({ where: { id: transactionId }, select: ['id', 'status'] });
          transactionStatus = transaction?.status;
        }

        await this.transactionLogService.logEntityChange(
          checkoutPayment.id,
          'CheckoutPayment',
          transactionId,
          'create',
          {
            status: checkoutPayment.status,
            provider: checkoutPayment.provider,
            intent: checkoutPayment.intent,
            reference: checkoutPayment.reference,
          },
          checkoutPayment.status,
          checkoutPayment.amount,
          transactionStatus,
        );
      } catch (error) {
        // Log error but don't throw - we don't want to break the main transaction
        console.error('Error logging checkout payment creation:', error);
      }
    });
  }

  async afterUpdate(event: UpdateEvent<CheckoutPayment>): Promise<void> {
    const checkoutPayment = event.entity as CheckoutPayment;
    
    if (!checkoutPayment || !checkoutPayment.id) {
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
            checkoutPayment[column as keyof CheckoutPayment] !== undefined
          ) {
            changes[column] = {
              old: event.databaseEntity[column as keyof CheckoutPayment],
              new: checkoutPayment[column as keyof CheckoutPayment],
            };
          }
        });

        // Get transactionId: use new value if it was updated, otherwise use database value
        const transactionIdUpdated = changedColumns.includes('transactionId');
        const transactionId = transactionIdUpdated
          ? checkoutPayment.transactionId
          : event.databaseEntity?.transactionId || checkoutPayment.transactionId;

        // Query Transaction entity to get its current status
        let transactionStatus: string | undefined;
        if (transactionId) {
          const transaction = await this.dataSource
            .getRepository(Transaction)
            .findOne({ where: { id: transactionId }, select: ['id', 'status'] });
          transactionStatus = transaction?.status;
        }

        await this.transactionLogService.logEntityChange(
          checkoutPayment.id,
          'CheckoutPayment',
          transactionId,
          'update',
          changes,
          checkoutPayment.status,
          checkoutPayment.amount,
          transactionStatus,
        );
      } catch (error) {
        // Log error but don't throw - we don't want to break the main transaction
        console.error('Error logging checkout payment update:', error);
      }
    });
  }
}

