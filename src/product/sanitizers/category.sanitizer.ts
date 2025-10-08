import { Injectable } from '@nestjs/common';
import { ProductCategory } from '../../entities/product-category.entity';

export type FormattedCategory = {
  id: string;
  description: string;
  name: string;
};

@Injectable()
export class ProductCategorySanitizer {
  constructor() {}

  formatCategory(category: ProductCategory): FormattedCategory {
    return {
      name: category.name,
      description: category.description,
      id: category.id,
    };
  }
}
