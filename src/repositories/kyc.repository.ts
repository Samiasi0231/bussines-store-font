import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Kyc } from '../entities/kyc.entity';

export class KycRepository extends EntityRepository<Kyc> {
  constructor(@InjectRepository(Kyc) repo: Repository<Kyc>) {
    super(repo);
  }
}
