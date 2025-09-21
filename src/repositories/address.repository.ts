import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from '../entities/address.entity';

export class AddressRepository extends EntityRepository<Address> {
  constructor(@InjectRepository(Address) repo: Repository<Address>) {
    super(repo);
  }
}
