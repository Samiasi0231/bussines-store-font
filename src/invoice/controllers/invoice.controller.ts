import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvoiceService } from '../services/invoice.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateInvoiceDTO,
  GetInvoicesDTO,
  updateInvoiceStatusDTO,
} from '../dtos/invoice.dto';
import { User } from '../../@common/decorators/user.decorator';
import { UserProfile } from '../../user/interfaces/user.interface';
import { UUID } from 'crypto';
import { GetByIdParamDTO } from '../../@common/dtos/general.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  async createInvoice(
    @Body() body: CreateInvoiceDTO,
    @User() user: UserProfile,
  ) {
    return this.invoiceService.createInvoice(body, user.id as UUID);
  }

  @Get()
  async getInvoices(@Query() query: GetInvoicesDTO) {
    return this.invoiceService.getInvoices(query);
  }

  @Post(':id/status')
  async updateInvoiceStatus(
    @Param() param: GetByIdParamDTO,
    @Body() body: updateInvoiceStatusDTO,
  ) {
    return this.invoiceService.updateInvoiceStatus(
      param.id as UUID,
      body.status,
    );
  }

  @Get(':id')
  async getInvoice(@Param() param: GetByIdParamDTO) {
    return this.invoiceService.getInvoice(param.id as UUID);
  }
}
