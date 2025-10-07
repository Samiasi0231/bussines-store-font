import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCategory } from '../entities/product-category.entity';

export class ProductCategoryRepository extends EntityRepository<ProductCategory> {
  constructor(
    @InjectRepository(ProductCategory) repo: Repository<ProductCategory>,
  ) {
    super(repo);
  }

  async categoryExists(name: string): Promise<ProductCategory> {
    return this.createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', {
        name: name.toLowerCase(),
      })
      .getOne();
  }
}
