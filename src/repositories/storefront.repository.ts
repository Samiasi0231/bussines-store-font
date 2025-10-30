import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Storefront } from '../entities/storefront.entity';

export class StorefrontRepository extends EntityRepository<Storefront> {
  constructor(@InjectRepository(Storefront) repo: Repository<Storefront>) {
    super(repo);
  }
}
