import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../@common/decorators/user.decorator';
import { UserProfile } from '../../user/interfaces/user.interface';
import { UUID } from 'crypto';
import { InvoiceUserService } from '../services/invoice-user.service';
import {
  CreateInvoiceUserDTO,
  GetInvoiceUsersDTO,
} from '../dtos/invoice-user.dto';

@Controller('invoice-users')
@UseGuards(JwtAuthGuard)
export class InvoiceUserController {
  constructor(private readonly invoiceUserService: InvoiceUserService) {}

  @Post()
  async createUser(
    @Body() body: CreateInvoiceUserDTO,
    @User() businessOwner: UserProfile,
  ) {
    return this.invoiceUserService.createUser(body, businessOwner.id as UUID);
  }

  @Get()
  async getUsers(@Query() query: GetInvoiceUsersDTO) {
    return this.invoiceUserService.getUsers(query);
  }
}
