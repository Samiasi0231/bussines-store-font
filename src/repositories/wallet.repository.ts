import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from '../entities/wallet.entity';

export class WalletRepository extends EntityRepository<Wallet> {
  constructor(@InjectRepository(Wallet) repo: Repository<Wallet>) {
    super(repo);
  }
}
