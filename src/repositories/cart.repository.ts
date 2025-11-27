import { Repository } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from '../entities/cart.entity';
import { UUID } from 'crypto';

export class CartRepository extends EntityRepository<Cart> {
  constructor(@InjectRepository(Cart) repo: Repository<Cart>) {
    super(repo);
  }

  async findByUserId(userId: UUID) {
    return this.findOne({
      where: { user: userId as any },
      relations: [
        'items',
        'items.product',
        'items.productVariant',
        'items.productVariant.attributes',
      ],
      order: {
        items: {
          createdAt: 'ASC',
        },
      },
      // TypeORM automatically excludes soft-deleted items when using relations
    });
  }

  async findActiveCartByUserId(userId: UUID, options?: any) {
    const now = new Date();
    const cart = await this.findOne({
      where: {
        user: userId as any,
      },
      relations:
        options?.relations || [
          'items',
          'items.product',
          'items.productVariant',
          'items.productVariant.attributes',
        ],
      order: {
        items: {
          createdAt: 'ASC',
        },
      },
      // TypeORM automatically excludes soft-deleted items when using relations
    });

    // Check if cart exists and is not expired
    if (cart && (!cart.expiresAt || cart.expiresAt > now)) {
      // Filter out soft-deleted items manually if needed
      if (cart.items) {
        cart.items = cart.items.filter((item) => !item.deletedAt);
      }
      return cart;
    }

    return null;
  }

  async findOrCreateByUserId(userId: UUID) {
    let cart = await this.findActiveCartByUserId(userId);
    
    if (!cart) {
      cart = await this.createStrict({
        user: userId as any,
        expiresAt: this.getDefaultExpirationDate(),
      } as any);
    }

    return cart;
  }

  private getDefaultExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
    return expirationDate;
  }

  async softDeleteExpiredCarts() {
    const now = new Date();
    // Find all carts that are expired
    const allCarts = await this.find({
      where: {},
    });

    // Filter expired carts (not linked to orders - we'll check this via subquery)
    const expiredCarts = allCarts.filter(
      (cart) => cart.expiresAt && cart.expiresAt < now,
    );

    // Soft delete expired carts
    // Note: Carts linked to orders should be kept for historical purposes
    // but we can still soft delete them as the relationship is preserved
    let deletedCount = 0;
    for (const cart of expiredCarts) {
      await this.softDeleteById(cart.id);
      deletedCount++;
    }

    return { affected: deletedCount };
  }
}

