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
    return this.find({
      where: { cart: { id: cartIdString } as any },
      relations: ['product', 'productVariant', 'productVariant.attributes'],
      order: {
        createdAt: 'ASC',
      },
      withDeleted: false, // Exclude soft-deleted items
    });
  }

  async findByCartIdAndProductId(
    cartId: UUID,
    productId: UUID,
    productVariantId?: UUID,
  ) {
    const cartIdString = ensureUuidString(cartId);
    const productIdString = ensureUuidString(productId);
    const productVariantIdString = productVariantId ? ensureUuidString(productVariantId) : undefined;

    const where: any = {
      cart: { id: cartIdString } as any,
      product: { id: productIdString } as any,
    };

    if (productVariantIdString) {
      where.productVariant = { id: productVariantIdString } as any;
    } else {
      where.productVariant = null;
    }

    return this.findOne({
      where,
      relations: ['product', 'productVariant', 'productVariant.attributes'],
      withDeleted: false, // Exclude soft-deleted items
    });
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

