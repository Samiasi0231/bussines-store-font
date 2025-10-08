import { FindOneOptions, Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '../entities/store.entity';
import { UUID } from 'crypto';

export class StoreRepository extends EntityRepository<Store> {
  constructor(@InjectRepository(Store) repo: Repository<Store>) {
    super(repo);
  }

  async findByBusinessId(
    id: UUID,
    options?: Omit<FindOneOptions<Store>, 'where'>,
  ) {
    if (!id) return null;
    return this.find({ ...options, where: { business: id } });
  }
}
