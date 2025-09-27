import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Kyc } from '../entities/kyc.entity';
import { UUID } from 'crypto';

export class KycRepository extends EntityRepository<Kyc> {
  constructor(@InjectRepository(Kyc) repo: Repository<Kyc>) {
    super(repo);
  }

  async findByUserId(
    id: UUID,
    lock?:
      | {
          mode: 'optimistic';
          version: number | Date;
        }
      | {
          mode:
            | 'pessimistic_read'
            | 'pessimistic_write'
            | 'dirty_read'
            | 'pessimistic_partial_write'
            | 'pessimistic_write_or_fail'
            | 'for_no_key_update'
            | 'for_key_share';
          tables?: string[];
          onLocked?: 'nowait' | 'skip_locked';
        },
  ) {
    if (!id) return null;
    return this.findOne({ where: { user: id }, lock });
  }
}
