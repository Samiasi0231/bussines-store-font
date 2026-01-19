import { Module } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardSanitizer } from './dasdboard.sanitizer';
import { WalletModule } from '../wallet/wallet.module';
import { BusinessModule } from '../business/business.module';
import { ProductModule } from '../product/product.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [WalletModule, BusinessModule, ProductModule, OrdersModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardSanitizer],
})
export class DashboardModule {}
