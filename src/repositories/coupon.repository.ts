import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from '../entities/coupon.entity';

export class CouponRepository extends EntityRepository<Coupon> {
  constructor(@InjectRepository(Coupon) repo: Repository<Coupon>) {
    super(repo);
  }
}
