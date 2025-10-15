import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../entities/transaction.entity';

export class TransactionRepository extends EntityRepository<Transaction> {
  constructor(@InjectRepository(Transaction) repo: Repository<Transaction>) {
    super(repo);
  }
}
