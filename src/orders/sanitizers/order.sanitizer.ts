import { Injectable } from '@nestjs/common';
import { Status } from '../../@common/constants/status.constant';
import { Order } from '../../entities/order.entity';

export type FormattedOrder = {
  id: string;
  status: Status;
  subtotal: number;
  totalAmount: number;
  discountAmount: number;
  note: string;
  date: Date;
};

@Injectable()
export class OrderSanitizer {
  constructor() {}

  formatOrder(data: Order): FormattedOrder {
    return {
      status: data.status,
      id: data.id,
      note: data.note,
      subtotal: data.subtotal,
      date: data.date,
      totalAmount: data.totalAmount,
      discountAmount: data.discountAmount,
    };
  }
}
