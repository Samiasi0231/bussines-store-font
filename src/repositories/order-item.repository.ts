import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderItem } from '../entities/order-item.entity';

export class OrderItemRepository extends EntityRepository<OrderItem> {
  constructor(@InjectRepository(OrderItem) repo: Repository<OrderItem>) {
    super(repo);
  }
}
