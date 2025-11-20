import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { InitiateCheckoutPaymentDTO } from './dtos/checkout.dto';
import {
  GetTransactionByReferenceDTO,
  GetTransactionsDTO,
} from './dtos/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('checkout/initiate')
  async initiateCheckoutPayment(@Body() payload: InitiateCheckoutPaymentDTO) {
    return this.transactionService.initiateCheckoutPayment(payload);
  }

  @Get()
  async getTransactions(@Query() payload: GetTransactionsDTO) {
    return this.transactionService.getTransactions(payload);
  }

  @Get(':reference')
  async getTransaction(@Param() payload: GetTransactionByReferenceDTO) {
    return this.transactionService.getTransaction(payload);
  }
}
