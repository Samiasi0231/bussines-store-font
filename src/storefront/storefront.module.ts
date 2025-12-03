import { Module } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { StorefrontController } from './storefront.controller';
import { StorefrontSanitizer } from './sanitizers/storefront.sanitizer';
import { ProductSanitizer } from '../product/sanitizers/product.sanitizer';

@Module({
  controllers: [StorefrontController],
  providers: [StorefrontService, StorefrontSanitizer, ProductSanitizer],
})
export class StoreFrontModule {}
