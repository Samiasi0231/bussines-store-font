import { Repository, LessThanOrEqual, In } from 'typeorm';
import { EntityRepository } from '../@common/database/entity.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from '../entities/cart.entity';
import { UUID } from 'crypto';
import { CartStatus } from '../entities/cart-status.constant';

export class CartRepository extends EntityRepository<Cart> {
  constructor(@InjectRepository(Cart) repo: Repository<Cart>) {
    super(repo);
  }

  async findByUserId(userId: UUID) {
    const cart = await this.findOne({
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

    // Ensure cart.id is always a string UUID (normalize after relation loading)
    if (cart && cart.id && typeof cart.id !== 'string') {
      cart.id = (cart.id as any)?.id || String(cart.id);
    }

    return cart;
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
      // Ensure cart.id is always a string UUID (normalize after relation loading)
      if (cart.id && typeof cart.id !== 'string') {
        cart.id = (cart.id as any)?.id || String(cart.id);
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

    // Ensure cart.id is always a string UUID (like other models)
    // This normalizes the ID after relation loading
    if (cart && cart.id && typeof cart.id !== 'string') {
      cart.id = (cart.id as any)?.id || String(cart.id);
    }

    return cart;
  }

  async findBySessionId(sessionId: string) {
    const cart = await this.findOne({
      where: { sessionId },
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
    });

    // Ensure cart.id is always a string UUID (normalize after relation loading)
    if (cart && cart.id && typeof cart.id !== 'string') {
      cart.id = (cart.id as any)?.id || String(cart.id);
    }

    return cart;
  }

  async findActiveCartBySessionId(sessionId: string, options?: any) {
    const now = new Date();
    const cart = await this.findOne({
      where: {
        sessionId,
        status: CartStatus.ACTIVE,
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
    });

    // Check if cart exists, is ACTIVE, and is not expired
    if (cart && cart.status === CartStatus.ACTIVE && (!cart.expiresAt || cart.expiresAt > now)) {
      // Filter out soft-deleted items manually if needed
      if (cart.items) {
        cart.items = cart.items.filter((item) => !item.deletedAt);
      }
      // Ensure cart.id is always a string UUID (normalize after relation loading)
      if (cart.id && typeof cart.id !== 'string') {
        cart.id = (cart.id as any)?.id || String(cart.id);
      }
      return cart;
    }

    return null;
  }

  async findOrCreateBySessionId(sessionId: string) {
    let cart = await this.findActiveCartBySessionId(sessionId);
    
    if (!cart) {
      cart = await this.createStrict({
        sessionId,
        status: CartStatus.ACTIVE,
        expiresAt: this.getDefaultExpirationDate(),
      } as any);
    }


    if (cart && cart.id && typeof cart.id !== 'string') {
      cart.id = (cart.id as any)?.id || String(cart.id);
    }

    return cart;
  }

  private getDefaultExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
    return expirationDate;
  }

  /**
   * Find all ACTIVE carts that have expired
   */
  async findExpiredActiveCarts(): Promise<Cart[]> {
    const now = new Date();
    return this.find({
      where: {
        status: CartStatus.ACTIVE,
        expiresAt: LessThanOrEqual(now),
      },
      relations: ['items', 'items.product'],
    });
  }

  /**
   * Mark carts as EXPIRED
   */
  async markCartsAsExpired(cartIds: UUID[]): Promise<void> {
    if (cartIds.length === 0) return;

    await this.createQueryBuilder()
      .update(Cart)
      .set({ status: CartStatus.EXPIRED })
      .where('id IN (:...ids)', { ids: cartIds })
      .execute();
  }

  /**
   * Mark a single cart as CONVERTED (when checkout completes)
   */
  async markCartAsConverted(cartId: UUID): Promise<void> {
    await this.update({ id: cartId }, { status: CartStatus.CONVERTED });
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

