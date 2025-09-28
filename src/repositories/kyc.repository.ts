import { FindOneOptions, Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Kyc } from '../entities/kyc.entity';
import { UUID } from 'crypto';

export class KycRepository extends EntityRepository<Kyc> {
  constructor(@InjectRepository(Kyc) repo: Repository<Kyc>) {
    super(repo);
  }

  async findByUserId(id: UUID, options?: Omit<FindOneOptions<Kyc>, 'where'>) {
    if (!id) return null;
    return this.findOne({ ...options, where: { user: id } });
  }
}
