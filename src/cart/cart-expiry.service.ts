import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartRepository } from '../repositories/cart.repository';
import { UUID } from 'crypto';

@Injectable()
export class CartExpiryService {
  private readonly logger = new Logger(CartExpiryService.name);

  constructor(private readonly cartRepository: CartRepository) {}

 
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'expire-carts',
  })
  async expireCarts(): Promise<void> {
    this.logger.log('Starting cart expiration job...');

    try {
      const expiredCarts = await this.cartRepository.findExpiredActiveCarts();

      if (expiredCarts.length === 0) {
        this.logger.log('No expired carts to process');
        return;
      }

      this.logger.log(`Found ${expiredCarts.length} expired cart(s) to process`);

      const cartIds: UUID[] = expiredCarts.map((cart) => {
        const cartId =
          typeof cart.id === 'string'
            ? cart.id
            : (cart.id as any)?.id || String(cart.id);
        return cartId as UUID;
      });


      await this.cartRepository.markCartsAsExpired(cartIds);

      this.logger.log(
        `Successfully marked ${cartIds.length} cart(s) as EXPIRED`,
      );

    } catch (error) {
      this.logger.error('Error in cart expiration job:', error);
    }
  }
}
