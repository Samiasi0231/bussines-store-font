import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { UUID } from 'crypto';

// Force extract UUID string - handles all cases
function ensureUuidString(value: any): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if (value.id) {
      const id = value.id;
      return typeof id === 'string' ? id : ensureUuidString(id);
    }
  }
  return String(value);
}

export class CartItemRepository extends EntityRepository<CartItem> {
  constructor(@InjectRepository(CartItem) repo: Repository<CartItem>) {
    super(repo);
  }

  async findByCartId(cartId: UUID) {
    const cartIdString = ensureUuidString(cartId);

    return this.createQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.product', 'product')
      .leftJoinAndSelect('cartItem.productVariant', 'productVariant')
      .leftJoinAndSelect('productVariant.attributes', 'productVariantAttributes')
      .where('cartItem.cart_id = :cartId', { cartId: cartIdString })
      .andWhere('cartItem.deleted_at IS NULL')
      .orderBy('cartItem.created_at', 'ASC')
      .getMany();
  }

  async findByCartIdAndProductId(
    cartId: UUID,
    productId: UUID,
    productVariantId?: UUID,
  ) {
    const cartIdString = ensureUuidString(cartId);
    const productIdString = ensureUuidString(productId);
    const productVariantIdString = productVariantId
      ? ensureUuidString(productVariantId)
      : null;

    const query = this.createQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.product', 'product')
      .leftJoinAndSelect('cartItem.productVariant', 'productVariant')
      .leftJoinAndSelect('productVariant.attributes', 'productVariantAttributes')
      .where('cartItem.cart_id = :cartId', { cartId: cartIdString })
      .andWhere('cartItem.product_id = :productId', { productId: productIdString })
      .andWhere('cartItem.deleted_at IS NULL');

    if (productVariantIdString) {
      query.andWhere('cartItem.product_variant_id = :variantId', {
        variantId: productVariantIdString,
      });
    } else {
      query.andWhere('cartItem.product_variant_id IS NULL');
    }

    return query.getOne();
  }

  async softDeleteByCartId(cartId: UUID) {
    const cartIdString = ensureUuidString(cartId);
    const items = await this.findByCartId(cartIdString as UUID);
    for (const item of items) {
      await this.softDeleteById(item.id);
    }
    return { affected: items.length };
  }
}

