import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductVariant } from '../entities/product-variant.entity';

export class ProductVariantRepository extends EntityRepository<ProductVariant> {
  constructor(
    @InjectRepository(ProductVariant) repo: Repository<ProductVariant>,
  ) {
    super(repo);
  }
}
