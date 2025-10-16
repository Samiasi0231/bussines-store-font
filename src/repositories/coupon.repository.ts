import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon, DiscountType } from '../entities/coupon.entity';
import { UUID } from 'crypto';

export class CouponRepository extends EntityRepository<Coupon> {
  constructor(@InjectRepository(Coupon) repo: Repository<Coupon>) {
    super(repo);
  }

  getDiscountAmount({
    coupon,
    amount,
  }: {
    coupon: Coupon;
    amount: number;
  }): number {
    const value = coupon.discountValue;
    const type = coupon.discountType;
    const maxDiscount = coupon.maxDiscountAmount;
    const minOrderAmount = coupon.minOrderAmount;
    let discountAmount = 0;

    if (minOrderAmount > amount) return discountAmount;
    if (type === DiscountType.FIXED) discountAmount = value;
    if (type === DiscountType.PERCENTAGE)
      discountAmount = (amount * value) / 100;

    return Math.min(discountAmount, maxDiscount);
  }

  async increaseUsageCount(id: UUID, count: number) {
    await this.increment({ id }, 'usedCount', count);
  }
}
