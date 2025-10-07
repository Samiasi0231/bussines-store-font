import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductImage } from '../entities/product-image.entity';

export class ProductImageRepository extends EntityRepository<ProductImage> {
  constructor(@InjectRepository(ProductImage) repo: Repository<ProductImage>) {
    super(repo);
  }
}
