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
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { Product } from '../entities/product.entity';
import { Business } from '../entities/business.entity';

@Injectable()
export class CouponService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly couponRepository: CouponRepository,
    private readonly responseService: ResponseService,
    private readonly couponSanitizer: CouponSanitizer,
    private readonly dbTransactionManager: DbTransactionManager,
  ) {}

  async createCoupon(payload: CreateCouponDTO) {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      product: products = [],
      business: businesses = [],
      validFrom,
      validTo,
      usageLimit,
      usageLimitPerUser,
    } = payload;

    let couponEntities: UUID[];
    let couponEntityType: 'product' | 'business';
    if (products.length > 0) {
      couponEntities = products;
      couponEntityType = 'product';
    } else {
      couponEntities = businesses;
      couponEntityType = 'business';
    }

    const response = await this.dbTransactionManager.transaction(
      async (manager) => {
        const entityManager = manager.entityManager;
        let product: Product;
        let business: Business;

        for (const couponEntity of couponEntities) {
          if (couponEntityType === 'product') {
            product = await this.productRepository
              .withManager(entityManager)
              .findById(couponEntity);

            if (!product)
              return this.responseService.sendError(
                ErrorMessage.NOT_FOUND('Product'),
                null,
                HttpStatus.NOT_FOUND,
              );
          }

          if (couponEntityType === 'business') {
            business = await this.businessRepository
              .withManager(entityManager)
              .findById(couponEntity);

            if (!business)
              return this.responseService.sendError(
                ErrorMessage.NOT_FOUND('Business'),
                null,
                HttpStatus.NOT_FOUND,
              );
          }

          if (code) {
            const couponCodeExists = await this.couponRepository
              .withManager(entityManager)
              .exists({
                where: { code },
              });

            if (couponCodeExists)
              return this.responseService.sendError(
                ErrorMessage.COUPON_CODE_EXISTS(code),
              );
          }

          await this.couponRepository.withManager(entityManager).createStrict({
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            product: product?.id,
            business: business?.id,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            usageLimit,
            usageLimitPerUser,
          });
        }

        return this.responseService.sendSuccess(
          SuccessMessage.OPERATION_SUCCESSFUL,
          null,
          HttpStatus.CREATED,
        );
      },
    );

    return response;
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

    const { results: coupons, pagination } =
      await this.couponRepository.paginate({
        filter,
        pagination: { page, limit },
      });

    const results = coupons.map((coupon) =>
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
