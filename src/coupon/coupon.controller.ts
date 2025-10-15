import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetByIdParamsDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';
import { CreateCouponDTO, GetCouponsQueryDTO } from './dtos/coupon.dto';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createCoupon(@Body() body: CreateCouponDTO) {
    return this.couponService.createCoupon(body);
  }

  @Get()
  async getCoupons(@Query() query: GetCouponsQueryDTO) {
    return this.couponService.getCoupons(query);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCoupon(@Param() param: GetByIdParamsDTO) {
    return this.couponService.deleteCoupon(param.id as UUID);
  }
}
