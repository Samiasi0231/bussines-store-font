import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionLog } from '../entities/transaction-log.entity';

export class TransactionLogRepository extends EntityRepository<TransactionLog> {
  constructor(
    @InjectRepository(TransactionLog) repo: Repository<TransactionLog>,
  ) {
    super(repo);
  }
}

