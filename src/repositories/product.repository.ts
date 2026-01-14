import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { UUID } from 'crypto';

export class ProductRepository extends EntityRepository<Product> {
  constructor(@InjectRepository(Product) repo: Repository<Product>) {
    super(repo);
  }

  async increaseQuantity(id: UUID, value: number) {
    return this.increment({ id }, 'quantity', value);
  }

  async decreaseQuantity(id: UUID, value: number) {
    return this.decrement({ id }, 'quantity', value);
  }

  async productNameExists(name: string, storeId?: UUID): Promise<boolean> {
    const query = this.createQueryBuilder('product').where(
      'LOWER(product.name) = LOWER(:name)',
      { name: name.toLowerCase() },
    );

    if (storeId) {
      query.andWhere('product.store_id = :storeId', { storeId });
    }

    return query.getExists();
  }

    async countByStore(storeId: UUID): Promise<number> {
    return this.createQueryBuilder('product')
      .where('product.store_id = :storeId', { storeId })
      .andWhere('product.deleted_at IS NULL')
      .getCount();
  }
}

