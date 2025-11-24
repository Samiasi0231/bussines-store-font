import { Injectable } from '@nestjs/common';
import { UUID } from 'crypto';
import { InvoiceUser } from '../../entities/invoice-user.entity';

export type FormattedInvoiceUser = {
  id: UUID;
  fullName: string;
  phone: string;
  email: string;
};

@Injectable()
export class InvoiceUserSanitizer {
  constructor() {}

  formatUser(user: InvoiceUser): FormattedInvoiceUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    };
  }
}

