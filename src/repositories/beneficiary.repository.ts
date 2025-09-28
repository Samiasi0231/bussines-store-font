import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Beneficiary } from '../entities/beneficiary.entity';

export class BeneficiaryRepository extends EntityRepository<Beneficiary> {
  constructor(@InjectRepository(Beneficiary) repo: Repository<Beneficiary>) {
    super(repo);
  }
}
