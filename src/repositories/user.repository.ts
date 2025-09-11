import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { EntityRepository } from '../common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';

export class UserRepository extends EntityRepository<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }
}
