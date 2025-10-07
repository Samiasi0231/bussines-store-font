import { Injectable } from '@nestjs/common';
import { ProductSubCategory } from '../../entities/product-sub-category.entity';
import { UUID } from 'crypto';

export type FormattedSubCategory = {
  id: string;
  description: string;
  name: string;
  category: string;
};

@Injectable()
export class ProductSubCategorySanitizer {
  constructor() {}

  formatSubCategory(data: ProductSubCategory): FormattedSubCategory {
    return {
      name: data.name,
      description: data.description,
      id: data.id,
      category: data.productCategory as UUID,
    };
  }
}
