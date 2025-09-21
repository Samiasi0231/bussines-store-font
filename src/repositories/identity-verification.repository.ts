import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { IdentityVerification } from '../entities/identity-verification.entity';

export class IdentityVerificationRepository extends EntityRepository<IdentityVerification> {
  constructor(
    @InjectRepository(IdentityVerification)
    repo: Repository<IdentityVerification>,
  ) {
    super(repo);
  }
}
