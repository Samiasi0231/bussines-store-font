import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { CheckoutSanitizer } from './sanitizers/checkout.sanitizer';
import { MonnifyProvider } from './providers/monnify.provider';
import { TransactionSanitizer } from './sanitizers/transaction.sanitizer';
import { TransactionLogService } from './transaction-log.service';
import { OrderSubscriber } from './subscribers/order.subscriber';
import { CheckoutPaymentSubscriber } from './subscribers/checkout-payment.subscriber';
import { TransactionSubscriber } from './subscribers/transaction.subscriber';

@Module({
  imports: [HttpModule],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    CheckoutSanitizer,
    MonnifyProvider,
    TransactionSanitizer,
    TransactionLogService,
    OrderSubscriber,
    CheckoutPaymentSubscriber,
    TransactionSubscriber,
  ],
  exports: [
    TransactionService,
    CheckoutSanitizer,
    MonnifyProvider,
    TransactionSanitizer,
    TransactionLogService,
  ],
})
export class TransactionModule {}
