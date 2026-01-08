import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { Transaction } from '../../entities/transaction.entity';
import { TransactionLogService } from '../transaction-log.service';

@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<Order> {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionLogService: TransactionLogService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Order;
  }

  async afterInsert(event: InsertEvent<Order>): Promise<void> {
    const order = event.entity;
    
    if (!order || !order.id) {
      return;
    }

    // Defer logging to next event loop tick to avoid blocking and connection pool issues
    setImmediate(async () => {
      try {
        // Query the database to get the actual saved entity with transactionId
        const savedOrder = await this.dataSource
          .getRepository(Order)
          .findOne({ where: { id: order.id }, select: ['id', 'transactionId', 'status', 'paymentStatus', 'totalAmount', 'paymentMethod'] });

        const transactionId = savedOrder?.transactionId || order.transactionId;

        // Query Transaction entity to get its current status
        let transactionStatus: string | undefined;
        if (transactionId) {
          const transaction = await this.dataSource
            .getRepository(Transaction)
            .findOne({ where: { id: transactionId }, select: ['id', 'status'] });
          transactionStatus = transaction?.status;
        }

        await this.transactionLogService.logEntityChange(
          order.id,
          'Order',
          transactionId,
          'create',
          {
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
          },
          order.status,
          order.totalAmount,
          transactionStatus,
        );
      } catch (error) {
        // Log error but don't throw - we don't want to break the main transaction
        console.error('Error logging order creation:', error);
      }
    });
  }

  async afterUpdate(event: UpdateEvent<Order>): Promise<void> {
    const order = event.entity as Order;
    
    if (!order || !order.id) {
      return;
    }

    // Defer logging to next event loop tick to avoid blocking and connection pool issues
    setImmediate(async () => {
      try {
        // Get changed columns
        const changedColumns = event.updatedColumns.map((col) => col.propertyName);
        const changes: Record<string, unknown> = {};
        
        changedColumns.forEach((column) => {
          if (event.databaseEntity && order[column as keyof Order] !== undefined) {
            changes[column] = {
              old: event.databaseEntity[column as keyof Order],
              new: order[column as keyof Order],
            };
          }
        });

        // Get transactionId: use new value if it was updated, otherwise use database value
        const transactionIdUpdated = changedColumns.includes('transactionId');
        const transactionId = transactionIdUpdated
          ? order.transactionId
          : event.databaseEntity?.transactionId || order.transactionId;

        // Query Transaction entity to get its current status
        let transactionStatus: string | undefined;
        if (transactionId) {
          const transaction = await this.dataSource
            .getRepository(Transaction)
            .findOne({ where: { id: transactionId }, select: ['id', 'status'] });
          transactionStatus = transaction?.status;
        }

        await this.transactionLogService.logEntityChange(
          order.id,
          'Order',
          transactionId,
          'update',
          changes,
          order.status,
          order.totalAmount,
          transactionStatus,
        );
      } catch (error) {
        // Log error but don't throw - we don't want to break the main transaction
        console.error('Error logging order update:', error);
      }
    });
  }
}

