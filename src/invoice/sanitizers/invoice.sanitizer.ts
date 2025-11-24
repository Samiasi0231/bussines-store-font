import { Injectable } from '@nestjs/common';
import { UUID } from 'crypto';
import { Invoice, InvoiceStatus } from '../../entities/invoice.entity';
import { Business } from '../../entities/business.entity';
import { InvoiceUser } from '../../entities/invoice-user.entity';
import { InvoiceItem } from '../../entities/invoice-item.entity';
import { Product } from '../../entities/product.entity';
import { Util } from '../../@common/utilities/helpers.utility';

export type FormattedInvoiceForList = {
  id: UUID;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate: Date;
  totalAmount: number;
  payableAmount: number;
  discountAmount: number;
  subtotal: number;
  invoiceNo: string;
  note: string;
};

export type FormattedInvoiceItem = {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
};

export type FormattedInvoice = {
  id: UUID;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate: Date;
  totalAmount: number;
  discountAmount: number;
  subtotal: number;
  payableAmount: number;
  invoiceNo: string;
  user: { name: string };
  note: string;
  business: { id: string; name: string; logo: string };
  items: FormattedInvoiceItem[];
};

@Injectable()
export class InvoiceSanitizer {
  constructor() {}

  formatInvoiceForList(invoice: Invoice): FormattedInvoiceForList {
    return {
      id: invoice.id,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      totalAmount: Util.toNaira(invoice.totalAmount),
      payableAmount: Util.toNaira(invoice.payableAmount),
      discountAmount: Util.toNaira(invoice.discountAmount),
      subtotal: Util.toNaira(invoice.subtotal),
      invoiceNo: invoice.invoiceNumber,
      note: invoice.note,
    };
  }

  private formatInvoiceItem(item: InvoiceItem) {
    const product = item.product as Product;
    return {
      name: product.name,
      description: product.description,
      quantity: item.quantity,
      unitPrice: Util.toNaira(item.unitPrice),
      discountAmount: Util.toNaira(item.discountAmount),
      subtotal: Util.toNaira(item.subtotal),
    };
  }

  formatInvoice(invoice: Invoice): FormattedInvoice {
    const business = invoice.business as Business;
    const user = invoice.invoiceUser as InvoiceUser;

    return {
      id: invoice.id,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      totalAmount: Util.toNaira(invoice.totalAmount),
      discountAmount: Util.toNaira(invoice.discountAmount),
      subtotal: Util.toNaira(invoice.subtotal),
      invoiceNo: invoice.invoiceNumber,
      user: { name: user.fullName },
      business: { id: business.id, name: business.name, logo: business.logo },
      items: invoice.invoiceItems.map((item) => this.formatInvoiceItem(item)),
      note: invoice.note,
      payableAmount: Util.toNaira(invoice.payableAmount),
    };
  }
}

