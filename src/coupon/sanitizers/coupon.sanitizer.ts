import { Injectable } from '@nestjs/common';
import { Coupon, DiscountType } from '../../entities/coupon.entity';
import { Status } from '../../@common/constants/status.constant';
import { Util } from '../../@common/utilities/helpers.utility';

export type FormattedCoupon = {
  code: string;
  id: string;
  isActive: boolean;
  discountType: DiscountType;
  discountValue: number;
  validFrom: Date;
  validTo: Date;
};

@Injectable()
export class CouponSanitizer {
  constructor() {}

  formatCoupon(data: Coupon): FormattedCoupon {
    return {
      code: data.code,
      isActive: data.status === Status.ACTIVE,
      id: data.id,
      validFrom: data.validFrom,
      validTo: data.validTo,
      discountType: data.discountType,
      discountValue:
        data.discountType === DiscountType.PERCENTAGE
          ? data.discountValue
          : Util.toNaira(data.discountValue),
    };
  }
}
