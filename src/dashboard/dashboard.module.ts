import { Module } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardSanitizer } from './dasdboard.sanitizer';
import { UserRepository } from '../repositories/user.repository';
import { BusinessRepository } from '../repositories/business.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { ProductRepository } from '../repositories/product.repository';
import { OrderRepository } from '../repositories/order.repository';
import { Business } from '../entities/business.entity';
import { Wallet } from '../entities/wallet.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User,Business, Wallet, Product, Order]),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardSanitizer,
    UserRepository,
    BusinessRepository,
    WalletRepository,
    ProductRepository,
    OrderRepository,
  ],
})
export class DashboardModule {}