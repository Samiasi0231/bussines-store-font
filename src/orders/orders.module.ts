import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderSanitizer } from './sanitizers/order.sanitizer';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSanitizer],
})
export class OrdersModule {}
