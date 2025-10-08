import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSubCategory } from '../entities/product-sub-category.entity';
import { UUID } from 'crypto';

export class ProductSubCategoryRepository extends EntityRepository<ProductSubCategory> {
  constructor(
    @InjectRepository(ProductSubCategory) repo: Repository<ProductSubCategory>,
  ) {
    super(repo);
  }

  async subCategoryExists(name: string, categoryId: UUID): Promise<boolean> {
    return this.createQueryBuilder('subCategory')
      .where('LOWER(subCategory.name) = LOWER(:name)', {
        name: name.toLowerCase(),
      })
      .andWhere('subCategory.category_id = :categoryId', { categoryId })
      .getExists();
  }
}
