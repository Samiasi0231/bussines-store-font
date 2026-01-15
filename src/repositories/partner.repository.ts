import { FindOneOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { Partner } from '../entities/partner.entity';

export class PartnerRepository extends EntityRepository<Partner> {
  constructor(@InjectRepository(Partner) repo: Repository<Partner>) {
    super(repo);
  }

  async findByEmail(email: string, options?: Omit<FindOneOptions<Partner>, 'where'>) {
    if (!email) return null;
    return this.findOne({ ...options, where: { email } });
  }
}

