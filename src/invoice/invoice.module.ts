import { Module } from '@nestjs/common';
import { InvoiceService } from './services/invoice.service';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceSanitizer } from './santizers/invoice.sanitizer';
import { InvoiceUserSanitizer } from './santizers/invoice-user.sanitizer';
import { InvoiceUserController } from './controllers/invoice-user.controller';
import { InvoiceUserService } from './services/invoice-user.service';

@Module({
  controllers: [InvoiceController, InvoiceUserController],
  providers: [
    InvoiceService,
    InvoiceUserService,
    InvoiceSanitizer,
    InvoiceUserSanitizer,
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
