import { Body, Controller, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDTO, updateOrderStatusDTO } from './dtos/order.dto';
import { GetByIdParamDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() body: CreateOrderDTO) {
    return this.ordersService.createOrder(body);
  }

  @Post(':id/status')
  updateOrderStatus(
    @Body() body: updateOrderStatusDTO,
    @Param() param: GetByIdParamDTO,
  ) {
    return this.ordersService.updateOrderStatus(param.id as UUID, body.status);
  }
}
