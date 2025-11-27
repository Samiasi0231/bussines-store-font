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
    return this.find({
      where: { cart: { id: cartId } as any },
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
    const where: any = {
      cart: { id: cartId } as any,
      product: { id: productId } as any,
    };

    if (productVariantId) {
      where.productVariant = { id: productVariantId } as any;
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
    const items = await this.findByCartId(cartId);
    for (const item of items) {
      await this.softDeleteById(item.id);
    }
    return { affected: items.length };
  }
}

