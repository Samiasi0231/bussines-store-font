import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCollection } from '../entities/product-collection.entity';
import { UUID } from 'crypto';

export class ProductCollectionRepository extends EntityRepository<ProductCollection> {
  constructor(
    @InjectRepository(ProductCollection) repo: Repository<ProductCollection>,
  ) {
    super(repo);
  }

  async collectionExists(name: string, businessId: UUID): Promise<boolean> {
    const query = this.createQueryBuilder('collection').where(
      'LOWER(collection.name) = LOWER(:name)',
      { name: name.toLowerCase() },
    );

    if (businessId) {
      query.andWhere('collection.business_id = :businessId', { businessId });
    }

    return query.getExists();
  }
}
