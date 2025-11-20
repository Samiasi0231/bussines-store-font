import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from '../entities/wallet.entity';
import { UUID } from 'crypto';

export class WalletRepository extends EntityRepository<Wallet> {
  constructor(@InjectRepository(Wallet) repo: Repository<Wallet>) {
    super(repo);
  }

  async increaseBalance(walletId: UUID, amount: number) {
    await this.increment({ id: walletId }, 'balance', amount);
  }

  async decreaseBalance(walletId: UUID, amount: number) {
    await this.decrement({ id: walletId }, 'balance', amount);
  }
}
