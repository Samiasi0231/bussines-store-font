import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemSettings } from '../entities/system-setting.entity';

export class SystemSettingsRepository extends EntityRepository<SystemSettings> {
  constructor(
    @InjectRepository(SystemSettings) repo: Repository<SystemSettings>,
  ) {
    super(repo);
  }
}
