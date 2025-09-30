import { FindOneOptions, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';

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
}
