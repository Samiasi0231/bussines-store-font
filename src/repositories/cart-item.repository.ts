import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { UUID } from 'crypto';

export class CartItemRepository extends EntityRepository<CartItem> {
  constructor(@InjectRepository(CartItem) repo: Repository<CartItem>) {
    super(repo);
  }

  async findByCartId(cartId: UUID) {
    // Extract UUID string from potentially object value
    const cartIdString = typeof cartId === 'string' 
      ? cartId 
      : (cartId as any)?.id || cartId;
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
    // Extract UUID strings from potentially object values
    const cartIdString = typeof cartId === 'string' 
      ? cartId 
      : (cartId as any)?.id || cartId;
    const productIdString = typeof productId === 'string' 
      ? productId 
      : (productId as any)?.id || productId;
    const productVariantIdString = productVariantId 
      ? (typeof productVariantId === 'string' 
          ? productVariantId 
          : (productVariantId as any)?.id || productVariantId)
      : undefined;

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
    // Extract UUID string from potentially object value
    const cartIdString = typeof cartId === 'string' 
      ? cartId 
      : (cartId as any)?.id || cartId;
    const items = await this.findByCartId(cartIdString as UUID);
    for (const item of items) {
      await this.softDeleteById(item.id);
    }
    return { affected: items.length };
  }
}

