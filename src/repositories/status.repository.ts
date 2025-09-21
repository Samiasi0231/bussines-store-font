import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { Status } from '../entities/status.entity';
import { InjectRepository } from '@nestjs/typeorm';

export class StatusRepository extends EntityRepository<Status> {
  constructor(@InjectRepository(Status) repo: Repository<Status>) {
    super(repo);
  }
}
