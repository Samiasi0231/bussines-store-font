import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductCategorySanitizer } from './sanitizers/category.sanitizer';
import { ProductSanitizer } from './sanitizers/product.sanitizer';
import { ProductSubCategorySanitizer } from './sanitizers/sub-category.sanitizer';
import { ProductCollectionController } from './product-collection.controller';

@Module({
  controllers: [ProductController, ProductCollectionController],
  providers: [
    ProductService,
    ProductCategorySanitizer,
    ProductSanitizer,
    ProductSubCategorySanitizer,
  ],
  exports: [
    ProductCategorySanitizer,
    ProductSanitizer,
    ProductSubCategorySanitizer,
  ],
})
export class ProductModule {}
