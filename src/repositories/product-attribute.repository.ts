import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { UUID } from 'crypto';

export class ProductAttributeRepository extends EntityRepository<ProductAttribute> {
  constructor(
    @InjectRepository(ProductAttribute) repo: Repository<ProductAttribute>,
  ) {
    super(repo);
  }

  async getProductOptions(
    productId: UUID,
  ): Promise<{ name: string; values: string[] }[]> {
    const attributes = await this.createQueryBuilder('attr')
      .select('attr.name', 'name')
      .addSelect('ARRAY_AGG(DISTINCT attr.value)', 'values')
      .innerJoin('attr.productVariant', 'variant')
      .where('variant.product_id = :productId', { productId })
      .andWhere('attr.deleted_at IS NULL')
      .groupBy('attr.name')
      .getRawMany();

    return attributes;
  }
}
