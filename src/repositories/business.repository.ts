import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';

export class BusinessRepository extends EntityRepository<Business> {
  constructor(@InjectRepository(Business) repo: Repository<Business>) {
    super(repo);
  }

  async findByCacNumber(
    cacNumber: string,
    options?: Omit<FindOneOptions<Business>, 'where'>,
  ) {
    if (!cacNumber) return null;
    return this.findOne({ ...options, where: { cacNumber } });
  }

  async findByUser(
    userId: UUID,
    options?: Omit<FindManyOptions<Business>, 'where'>,
  ) {
    if (!userId) return null;
    return this.find({ ...options, where: { user: userId } });
  }

   async findByUserWithStores(userId: UUID) {
    return this.createQueryBuilder('business')
      .leftJoinAndSelect('business.stores', 'stores')
      .where('business.user_id = :userId', { userId })
      .andWhere('business.deleted_at IS NULL')
      .getOne();
  }
}

