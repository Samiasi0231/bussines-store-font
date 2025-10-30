import { Module } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { StorefrontController } from './storefront.controller';
import { StorefrontSanitizer } from './sanitizers/storefront.sanitizer';

@Module({
  controllers: [StorefrontController],
  providers: [StorefrontService, StorefrontSanitizer],
})
export class StoreFrontModule {}
