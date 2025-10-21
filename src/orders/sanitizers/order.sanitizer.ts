import { Injectable } from '@nestjs/common';
import { Status } from '../../@common/constants/status.constant';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product } from '../../entities/product.entity';
import { Util } from '../../@common/utilities/helpers.utility';
import { Address } from '../../entities/address.entity';
import { KycSanitizer } from '../../kyc/sanitizers/kyc.sanitizer';

export type FormattedOrderForList = {
  id: string;
  status: Status;
  subtotal: number;
  totalAmount: number;
  discountAmount: number;
  note: string;
  date: Date;
};

type FormattedOrderItem = {
  product: { name: string; description: string };
  discountAmount: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type FormattedOrder = FormattedOrderForList & {
  items: FormattedOrderItem[];
  shippingAddress: Partial<Address>;
};

@Injectable()
export class OrderSanitizer {
  constructor(private readonly kycSanitizer: KycSanitizer) {}

  formatOrderForList(data: Order): FormattedOrderForList {
    return {
      status: data.status,
      id: data.id,
      note: data.note,
      subtotal: Util.toNaira(data.subtotal),
      date: data.date,
      totalAmount: Util.toNaira(data.totalAmount),
      discountAmount: Util.toNaira(data.discountAmount),
    };
  }

  private formatOrderItem(item: OrderItem): FormattedOrderItem {
    return {
      discountAmount: Util.toNaira(item.discountAmount),
      quantity: item.quantity,
      unitPrice: Util.toNaira(item.unitPrice),
      subtotal: Util.toNaira(item.totalPrice),
      product: {
        name: (item.product as Product).name,
        description: (item.product as Product).description,
      },
    };
  }

  formatOrder(data: Order): FormattedOrder {
    return {
      status: data.status,
      id: data.id,
      note: data.note,
      date: data.date,
      totalAmount: Util.toNaira(data.totalAmount),
      discountAmount: Util.toNaira(data.discountAmount),
      subtotal: Util.toNaira(data.subtotal),
      items: data.orderItems.map(this.formatOrderItem),
      shippingAddress: this.kycSanitizer.formatAddress(
        data.shippingAddress as Address,
      ),
    };
  }
}
