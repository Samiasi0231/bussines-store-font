import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceUser } from '../entities/invoice-user.entity';

export class InvoiceUserRepository extends EntityRepository<InvoiceUser> {
  constructor(@InjectRepository(InvoiceUser) repo: Repository<InvoiceUser>) {
    super(repo);
  }
}
