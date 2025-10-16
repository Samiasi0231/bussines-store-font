import { Injectable } from '@nestjs/common';
import { Status } from '../../@common/constants/status.constant';
import { Order } from '../../entities/order.entity';

export type FormattedOrder = {
  id: string;
  status: Status;
  subtotal: number;
  totalAmount: number;
  discountAmount: number;
};

@Injectable()
export class OrderSanitizer {
  constructor() {}

  formatOrder(data: Order): FormattedOrder {
    return {
      status: data.status,
      id: data.id,
      subtotal: data.subtotal,
      totalAmount: data.totalAmount,
      discountAmount: data.discountAmount,
    };
  }
}
