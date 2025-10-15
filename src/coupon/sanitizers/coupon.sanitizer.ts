import { Injectable } from '@nestjs/common';
import { Coupon } from '../../entities/coupon.entity';
import { Status } from '../../@common/constants/status.constant';

export type FormattedCoupon = {
  code: string;
  id: string;
  isActive: boolean;
};

@Injectable()
export class CouponSanitizer {
  constructor() {}

  formatCoupon(data: Coupon): FormattedCoupon {
    return {
      code: data.code,
      isActive: data.status === Status.ACTIVE,
      id: data.id,
    };
  }
}
