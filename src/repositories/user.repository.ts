import { FindOneOptions, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
export class UserRepository extends EntityRepository<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }

  async findByEmail(
    email: string,
    options?: Omit<FindOneOptions<User>, 'where'>,
  ) {
    if (!email) return null;
    return this.findOne({ ...options, where: { email } });
  }

  async findByPhoneNumber(
    phoneNumber: string,
    options?: Omit<FindOneOptions<User>, 'where'>,
  ) {
    if (!phoneNumber) return null;
    return this.findOne({ ...options, where: { phoneNumber } });
  }

   async existsById(userId: UUID): Promise<boolean> {
    const count = await this.createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .andWhere('user.deleted_at IS NULL')
      .getCount();

    return count > 0;
  }
}
