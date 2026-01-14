import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Business } from '../entities/business.entity';
import { Wallet } from '../entities/wallet.entity';
import { Product } from '../entities/product.entity';
import { UUID } from 'crypto';

dayjs.extend(isoWeek);

@Injectable()
export class DashboardRepository {
  private readonly logger = new Logger(DashboardRepository.name);

  constructor(private readonly dataSource: DataSource) {}

  async getBusinessByUser(userId: UUID) {
    return this.dataSource
      .getRepository(Business)
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.stores', 'stores')
      .where('business.user_id = :userId', { userId })
      .andWhere('business.deleted_at IS NULL')
      .getOne();
  }

  async hasWallet(userId: UUID): Promise<boolean> {
    const count = await this.dataSource
      .getRepository(Wallet)
      .createQueryBuilder('wallet')
      .where('wallet.user_id = :userId', { userId })
      .andWhere('wallet.deleted_at IS NULL')
      .getCount();

    return count > 0;
  }

  async countProducts(storeId: UUID): Promise<number> {
    return this.dataSource
      .getRepository(Product)
      .createQueryBuilder('product')
      .where('product.store_id = :storeId', { storeId })
      .andWhere('product.deleted_at IS NULL')
      .getCount();
  }


  async countCustomersThisWeek(storeId: UUID): Promise<number> {
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
        `Error counting customers this week: ${error.message}`,
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
        `Error counting orders this week: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

 
  async totalSold(storeId: UUID): Promise<number> {
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
        `Error calculating total sold: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }
}