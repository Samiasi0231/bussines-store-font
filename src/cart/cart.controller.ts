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
import { DeviceJwtAuthGuard } from '../auth/guards/device-jwt-auth.guard';
import { DeviceId } from '../@common/decorators/device.decorator';

@UseGuards(DeviceJwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@DeviceId() deviceId: string) {
    return this.cartService.getCart(deviceId);
  }

  @Post('items')
  addItem(@DeviceId() deviceId: string, @Body() body: AddCartItemDTO) {
    return this.cartService.addItem(deviceId, body);
  }

  @Patch('items')
  updateItem(@DeviceId() deviceId: string, @Body() body: UpdateCartItemDTO) {
    return this.cartService.updateItem(deviceId, body);
  }

  @Delete('items')
  removeItem(@DeviceId() deviceId: string, @Body() body: RemoveCartItemDTO) {
    return this.cartService.removeItem(deviceId, body);
  }

  @Delete()
  clearCart(@DeviceId() deviceId: string) {
    return this.cartService.clearCart(deviceId);
  }

  @Post('checkout')
  checkout(@DeviceId() deviceId: string, @Body() body: CheckoutCartDTO) {
    return this.cartService.checkout(deviceId, body);
  }
}

