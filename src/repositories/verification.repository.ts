import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Verification } from '../entities/verification.entity';

export class VerificationRepository extends EntityRepository<Verification> {
  constructor(@InjectRepository(Verification) repo: Repository<Verification>) {
    super(repo);
  }
}
