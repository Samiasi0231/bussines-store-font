import { Injectable } from '@nestjs/common';
import { Status } from '../../@common/constants/status.constant';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product } from '../../entities/product.entity';
import { Util } from '../../@common/utilities/helpers.utility';
import { Address } from '../../entities/address.entity';
import { KycSanitizer } from '../../kyc/sanitizers/kyc.sanitizer';
import { User } from '../../entities/user.entity';

export type FormattedOrderForList = {
  id: string;
  status: Status;
  subtotal: number;
  totalAmount: number;
  discountAmount: number;
  note: string;
  date: Date;
  shippingAddress: Partial<Address>;
  customer: { name: string };
  isInStoreOrder: boolean;
};

type FormattedOrderItem = {
  product: { name: string; description: string };
  discountAmount: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type FormattedOrder = FormattedOrderForList & {
  isInStoreOrder: boolean;
  items: FormattedOrderItem[];
  shippingAddress: Partial<Address>;
};

@Injectable()
export class OrderSanitizer {
  constructor(private readonly kycSanitizer: KycSanitizer) {}

  formatOrderForList(data: Order): FormattedOrderForList {
    const user = data.user as User;

    return {
      status: data.status,
      id: data.id,
      customer: { name: user?.fullName || data.inStoreOrderData?.name },
      note: data.note,
      subtotal: Util.toNaira(data.subtotal),
      date: data.date,
      totalAmount: Util.toNaira(data.totalAmount),
      discountAmount: Util.toNaira(data.discountAmount),
      shippingAddress: data.shippingAddress
        ? this.kycSanitizer.formatAddress(data.shippingAddress as Address)
        : data.inStoreOrderData?.address,
      isInStoreOrder: data.inStoreOrder,
    };
  }

  private formatOrderItem(item: OrderItem): FormattedOrderItem {
    return {
      discountAmount: Util.toNaira(item.discountAmount),
      quantity: item.quantity,
      unitPrice: Util.toNaira(item.unitPrice),
      subtotal: Util.toNaira(item.subtotal),
      product: {
        name: (item.product as Product).name,
        description: (item.product as Product).description,
      },
    };
  }

  formatOrder(data: Order): FormattedOrder {
    return {
      ...this.formatOrderForList(data),
      items: data.orderItems.map((item) => this.formatOrderItem(item)),
    };
  }
}
