import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CouponSanitizer } from './sanitizers/coupon.sanitizer';

@Module({
  controllers: [CouponController],
  providers: [CouponService, CouponSanitizer],
})
export class CouponModule {}
