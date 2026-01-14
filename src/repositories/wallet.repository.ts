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
   async existsByUserId(userId: UUID): Promise<boolean> {
    const count = await this.createQueryBuilder('wallet')
      .where('wallet.user_id = :userId', { userId })
      .andWhere('wallet.deleted_at IS NULL')
      .getCount();

    return count > 0;
  }
}


