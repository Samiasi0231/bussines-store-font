import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceItem } from '../entities/invoice-item.entity';

export class InvoiceItemRepository extends EntityRepository<InvoiceItem> {
  constructor(@InjectRepository(InvoiceItem) repo: Repository<InvoiceItem>) {
    super(repo);
  }
}
