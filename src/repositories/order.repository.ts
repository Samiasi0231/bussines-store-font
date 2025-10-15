import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';

export class OrderRepository extends EntityRepository<Order> {
  constructor(@InjectRepository(Order) repo: Repository<Order>) {
    super(repo);
  }
}
