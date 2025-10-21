import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDTO,
  GetOrdersDTO,
  updateOrderStatusDTO,
} from './dtos/order.dto';
import { GetByIdParamDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';
import { OrderAnalyticsDTO } from './dtos/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() body: CreateOrderDTO) {
    return this.ordersService.createOrder(body);
  }

  @Get()
  getOrders(@Query() query: GetOrdersDTO) {
    return this.ordersService.getOrders(query);
  }

  @Post(':id/status')
  updateOrderStatus(
    @Body() body: updateOrderStatusDTO,
    @Param() param: GetByIdParamDTO,
  ) {
    return this.ordersService.updateOrderStatus(param.id as UUID, body.status);
  }

  @Get('analytics')
  getOrderAnalytics(@Query() query: OrderAnalyticsDTO) {
    return this.ordersService.getOrderAnalytics(query);
  }
}
