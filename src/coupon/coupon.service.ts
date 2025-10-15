import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCouponDTO, GetCouponsQueryDTO } from './dtos/coupon.dto';
import { ProductRepository } from '../repositories/product.repository';
import { IResponse, ResponseService } from '../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import { BusinessRepository } from '../repositories/business.repository';
import { CouponRepository } from '../repositories/coupon.repository';
import { UUID } from 'crypto';
import { FindOptionsWhere } from 'typeorm';
import { Paginated } from '../@common/types/pagination.type';
import { Coupon } from '../entities/coupon.entity';
import {
  CouponSanitizer,
  FormattedCoupon,
} from './sanitizers/coupon.sanitizer';

@Injectable()
export class CouponService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly couponRepository: CouponRepository,
    private readonly responseService: ResponseService,
    private readonly couponSanitizer: CouponSanitizer,
  ) {}

  async createCoupon(payload: CreateCouponDTO) {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      productId,
      businessId,
      validFrom,
      validTo,
      usageLimit,
      usageLimitPerUser,
    } = payload;

    if (productId) {
      const product = await this.productRepository.findById(productId);

      if (!product)
        return this.responseService.sendError(
          ErrorMessage.NOT_FOUND('Product'),
          null,
          HttpStatus.NOT_FOUND,
        );
    }

    if (businessId) {
      const business = await this.businessRepository.findById(businessId);

      if (!business)
        return this.responseService.sendError(
          ErrorMessage.NOT_FOUND('Business'),
          null,
          HttpStatus.NOT_FOUND,
        );
    }

    if (code) {
      const couponCodeExists = await this.couponRepository.exists({
        where: { code },
      });

      if (couponCodeExists)
        return this.responseService.sendError(ErrorMessage.COUPON_CODE_EXISTS);
    }

    const coupon = await this.couponRepository.createStrict({
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      product: productId,
      business: businessId,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      usageLimit,
      usageLimitPerUser,
    });

    const data = this.couponSanitizer.formatCoupon(coupon);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
      HttpStatus.CREATED,
    );
  }

  async deleteCoupon(id: UUID) {
    const coupon = await this.couponRepository.findById(id);

    if (!coupon)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Coupon'),
        null,
        HttpStatus.NOT_FOUND,
      );

    await this.couponRepository.softDeleteById(id);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
    );
  }

  async getCoupons(
    data: GetCouponsQueryDTO,
  ): Promise<IResponse<Paginated<FormattedCoupon>>> {
    const { page, limit, productId, discountType, businessId } = data;
    const filter: FindOptionsWhere<Coupon> = {};

    if (productId) filter.product = productId;
    if (discountType) filter.discountType = discountType;
    if (businessId) filter.business = businessId;

    const { results: subCategories, pagination } =
      await this.couponRepository.paginate({
        filter,
        pagination: { page, limit },
      });

    const results = subCategories.map((coupon) =>
      this.couponSanitizer.formatCoupon(coupon),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results,
        pagination,
      },
    );
  }
}
