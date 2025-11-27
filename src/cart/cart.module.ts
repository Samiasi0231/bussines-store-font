import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartSanitizer } from './sanitizers/cart.sanitizer';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem]),
    OrdersModule,
  ],
  controllers: [CartController],
  providers: [
    CartService,
    CartSanitizer,
    CartRepository,
    CartItemRepository,
    ProductRepository,
    ProductVariantRepository,
  ],
  exports: [CartService],
})
export class CartModule {}

