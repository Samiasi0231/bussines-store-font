import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  AddCartItemDTO,
  UpdateCartItemDTO,
  RemoveCartItemDTO,
  CheckoutCartDTO,
} from './dtos/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@User() user: UserProfile) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  addItem(@User() user: UserProfile, @Body() body: AddCartItemDTO) {
    return this.cartService.addItem(user.id, body);
  }

  @Patch('items')
  updateItem(@User() user: UserProfile, @Body() body: UpdateCartItemDTO) {
    return this.cartService.updateItem(user.id, body);
  }

  @Delete('items')
  removeItem(@User() user: UserProfile, @Body() body: RemoveCartItemDTO) {
    return this.cartService.removeItem(user.id, body);
  }

  @Delete()
  clearCart(@User() user: UserProfile) {
    return this.cartService.clearCart(user.id);
  }

  @Post('checkout')
  checkout(@User() user: UserProfile, @Body() body: CheckoutCartDTO) {
    return this.cartService.checkout(user.id, body);
  }
}

