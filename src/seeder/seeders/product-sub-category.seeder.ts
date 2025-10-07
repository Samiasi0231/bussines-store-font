import { Injectable, Logger } from '@nestjs/common';
import { ProductCategoryRepository } from '../../repositories/product-category.repository';
import { ProductCategories } from './product-category.seeder';
import { ProductSubCategoryRepository } from '../../repositories/product-sub-category.repository';

@Injectable()
export class ProductSubCategorySeeder {
  private readonly logger = new Logger(ProductSubCategorySeeder.name);

  constructor(
    private productCategoryRepository: ProductCategoryRepository,
    private productSubCategoryRepository: ProductSubCategoryRepository,
  ) {}

  async seed() {
    for (const category of ProductCategories) {
      const categoryName = category.name;
      const subCategories = category.subCategories;

      const productCategory =
        await this.productCategoryRepository.categoryExists(categoryName);

      if (!productCategory)
        this.logger.error(`Category ${categoryName} does not exist`);

      const categoryId = productCategory.id;

      for (const subCategory of subCategories) {
        const exists =
          await this.productSubCategoryRepository.subCategoryExists(
            subCategory,
            categoryId,
          );

        if (!exists) {
          await this.productSubCategoryRepository.createStrict({
            name: subCategory,
            productCategory: categoryId,
          });

          this.logger.log(`seeded sub-category: ${subCategory}`);
        }
      }
    }
  }
}
