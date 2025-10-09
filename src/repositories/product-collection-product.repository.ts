import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCollectionProduct } from '../entities/product-collection-product.entity';

export class ProductCollectionProductRepository extends EntityRepository<ProductCollectionProduct> {
  constructor(
    @InjectRepository(ProductCollectionProduct)
    repo: Repository<ProductCollectionProduct>,
  ) {
    super(repo);
  }
}
