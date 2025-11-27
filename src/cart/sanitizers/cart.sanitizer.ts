import { Injectable } from '@nestjs/common';
import { Cart } from '../../entities/cart.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { Product } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductAttribute } from '../../entities/product-attribute.entity';
import { Util } from '../../@common/utilities/helpers.utility';

export type FormattedCartItem = {
  id: string;
  productId: string;
  productVariantId?: string;
  productName: string;
  productDescription?: string;
  variantAttributes?: Array<{ name: string; value: string }>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type FormattedCart = {
  id: string;
  userId: string;
  items: FormattedCartItem[];
  itemCount: number;
  subtotal: number;
  expiresAt?: Date;
};

@Injectable()
export class CartSanitizer {
  private formatCartItem(item: CartItem): FormattedCartItem {
    const product = item.product as Product;
    const variant = item.productVariant as (ProductVariant & { attributes?: ProductAttribute[] }) | undefined;

    // Format variant attributes if they exist
    const variantAttributes = variant?.attributes
      ? variant.attributes.map((attr: ProductAttribute) => ({
          name: attr.name,
          value: attr.value,
        }))
      : undefined;

    return {
      id: item.id,
      productId: product.id,
      productVariantId: variant?.id,
      productName: product.name,
      productDescription: product.description,
      variantAttributes,
      quantity: item.quantity,
      unitPrice: Util.toNaira(item.unitPrice),
      subtotal: Util.toNaira(item.unitPrice * item.quantity),
    };
  }

  formatCart(cart: Cart): FormattedCart {
    const items = cart.items || [];
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    return {
      id: cart.id,
      userId: (cart.user as any).id || (cart.user as string),
      items: items.map((item) => this.formatCartItem(item)),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Util.toNaira(subtotal),
      expiresAt: cart.expiresAt,
    };
  }
}

