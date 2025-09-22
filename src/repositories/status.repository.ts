import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { Status } from '../entities/status.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Status as StatusName } from '../@common/constants/status.constant';

export class StatusRepository extends EntityRepository<Status> {
  constructor(@InjectRepository(Status) repo: Repository<Status>) {
    super(repo);
  }

  async findByName(name: StatusName) {
    return this.findOne({ where: { name } });
  }
}
