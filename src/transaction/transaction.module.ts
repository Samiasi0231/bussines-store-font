import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { CheckoutSanitizer } from './sanitizers/checkout.sanitizer';
import { MonnifyProvider } from './providers/monnify.provider';
import { TransactionSanitizer } from './sanitizers/transaction.sanitizer';

@Module({
  imports: [HttpModule],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    CheckoutSanitizer,
    MonnifyProvider,
    TransactionSanitizer,
  ],
  exports: [
    TransactionService,
    CheckoutSanitizer,
    MonnifyProvider,
    TransactionSanitizer,
  ],
})
export class TransactionModule {}
