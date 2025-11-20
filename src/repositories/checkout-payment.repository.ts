import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { CheckoutPayment } from '../entities/checkout-payment.entity';

export class CheckoutPaymentRepository extends EntityRepository<CheckoutPayment> {
  constructor(
    @InjectRepository(CheckoutPayment) repo: Repository<CheckoutPayment>,
  ) {
    super(repo);
  }
}
