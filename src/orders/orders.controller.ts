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
  VerifyPaymentDTO,
} from './dtos/order.dto';
import { GetByIdParamDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';
import { OrderAnalyticsDTO } from './dtos/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RmqQueue } from '../@common/constants/queues.constant';
import { EventPattern } from '@nestjs/microservices';
import { Public } from '../@common/decorators/public.decorator';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() body: CreateOrderDTO) {
    return this.ordersService.createOrder(body);
  }

  @Get()
  getOrders(@Query() query: GetOrdersDTO, @User() user: UserProfile) {
    return this.ordersService.getOrders(query, user.id);
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

  @Get(':id')
  getOrder(@Param() param: GetByIdParamDTO) {
    return this.ordersService.getOrder(param.id as UUID);
  }

  /**
   * Verify payment and process order
   * @param body Payment verification data
   * @returns Order payment processing result
   */
  @Post('verify-payment')
  verifyPayment(@Body() body: VerifyPaymentDTO) {
    return this.ordersService.verifyAndProcessPayment(body);
  }

  /**
   * Requery order payment status
   * Manually check payment status with provider
   * @param orderId Order ID
   * @returns Updated payment status
   */
  @Get(':orderId/payment-status')
  requeryPaymentStatus(@Param('orderId') orderId: UUID) {
    return this.ordersService.requeryOrderPaymentStatus(orderId);
  }

  @Public()
  @EventPattern(RmqQueue.PROCESS_ORDER_PAYMENT)
  async handleOrderPaymentProcessed(payload: { orderId: string }) {
    return this.ordersService.processOrderPayment(payload);
  }
}
