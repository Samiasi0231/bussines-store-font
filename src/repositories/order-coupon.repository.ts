import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderCoupon } from '../entities/order-coupon.entity';

export class OrderCouponRepository extends EntityRepository<OrderCoupon> {
  constructor(@InjectRepository(OrderCoupon) repo: Repository<OrderCoupon>) {
    super(repo);
  }
}
