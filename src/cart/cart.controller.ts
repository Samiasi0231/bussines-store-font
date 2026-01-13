import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  AddCartItemDTO,
  UpdateCartItemDTO,
  RemoveCartItemDTO,
  CheckoutCartDTO,
} from './dtos/cart.dto';
import { SessionId } from '../@common/decorators/session.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@SessionId() sessionId: string) {
    return this.cartService.getCart(sessionId);
  }

  @Post('items')
  addItem(@SessionId() sessionId: string, @Body() body: AddCartItemDTO) {
    return this.cartService.addItem(sessionId, body);
  }

  @Patch('items')
  updateItem(@SessionId() sessionId: string, @Body() body: UpdateCartItemDTO) {
    return this.cartService.updateItem(sessionId, body);
  }

  @Delete('items')
  removeItem(@SessionId() sessionId: string, @Body() body: RemoveCartItemDTO) {
    return this.cartService.removeItem(sessionId, body);
  }

  @Delete()
  clearCart(@SessionId() sessionId: string) {
    return this.cartService.clearCart(sessionId);
  }

  @Post('checkout')
  checkout(@SessionId() sessionId: string, @Body() body: CheckoutCartDTO) {
    return this.cartService.checkout(sessionId, body);
  }
}

