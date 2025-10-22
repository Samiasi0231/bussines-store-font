import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderSanitizer } from './sanitizers/order.sanitizer';
import { UserModule } from '../user/user.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [UserModule, KycModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSanitizer],
})
export class OrdersModule {}
