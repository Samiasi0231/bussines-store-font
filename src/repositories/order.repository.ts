import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { UUID } from 'crypto';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

@Injectable()
export class OrderRepository extends EntityRepository<Order> {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(
    @InjectRepository(Order) repo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {
    super(repo);
  }

  async countUniqueCustomersThisWeek(storeId: UUID): Promise<number> {
    try {
      const start = dayjs().startOf('isoWeek').toDate();
      const end = dayjs().endOf('isoWeek').toDate();

      const result = await this.dataSource.query(
        `
        SELECT COUNT(DISTINCT o.user_id) as count
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.store_id = $1
          AND o.created_at BETWEEN $2 AND $3
          AND o.deleted_at IS NULL
          AND oi.deleted_at IS NULL
          AND o.user_id IS NOT NULL
        `,
        [storeId, start, end],
      );

      return Number(result[0]?.count || 0);
    } catch (error) {
      this.logger.error(
        `Error counting unique customers: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async countOrdersThisWeek(storeId: UUID): Promise<number> {
    try {
      const start = dayjs().startOf('isoWeek').toDate();
      const end = dayjs().endOf('isoWeek').toDate();

      const result = await this.dataSource.query(
        `
        SELECT COUNT(DISTINCT o.id) as count
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.store_id = $1
          AND o.created_at BETWEEN $2 AND $3
          AND o.deleted_at IS NULL
          AND oi.deleted_at IS NULL
        `,
        [storeId, start, end],
      );

      return Number(result[0]?.count || 0);
    } catch (error) {
      this.logger.error(
        `Error counting orders: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async calculateTotalSales(storeId: UUID): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `
        SELECT COALESCE(SUM(oi.subtotal), 0) as sum
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        WHERE oi.store_id = $1
          AND o.status = 'COMPLETED'
          AND o.deleted_at IS NULL
          AND oi.deleted_at IS NULL
        `,
        [storeId],
      );

      return Number(result[0]?.sum || 0);
    } catch (error) {
      this.logger.error(
        `Error calculating total sales: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }
}