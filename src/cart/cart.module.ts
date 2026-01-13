import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartExpiryService } from './cart-expiry.service';
import { CartSanitizer } from './sanitizers/cart.sanitizer';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { OrdersModule } from '../orders/orders.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Product, ProductVariant]),
    OrdersModule,
    TransactionModule
  ],
  controllers: [CartController],
  providers: [
    CartService,
    CartExpiryService,
    CartSanitizer,
    CartRepository,
    CartItemRepository,
    ProductRepository,
    ProductVariantRepository,
  ],
  exports: [CartService],
})
export class CartModule {}

