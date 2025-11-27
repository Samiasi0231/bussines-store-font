import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { CartSanitizer, FormattedCart } from './sanitizers/cart.sanitizer';
import {
  AddCartItemDTO,
  UpdateCartItemDTO,
  RemoveCartItemDTO,
  CheckoutCartDTO,
} from './dtos/cart.dto';
import { IResponse, ResponseService } from '../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import { UUID } from 'crypto';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { OrdersService } from '../orders/orders.service';
import {
  CreateOrderDTO,
  ShippingAddressDTO as OrderShippingAddressDTO,
} from '../orders/dtos/order.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly cartSanitizer: CartSanitizer,
    private readonly responseService: ResponseService,
    private readonly ordersService: OrdersService,
  ) {}

  async getCart(userId: UUID): Promise<IResponse<FormattedCart>> {
    // Ensure userId is a string UUID, not an object
    const userIdString = typeof userId === 'string' ? userId : (userId as any)?.id || userId;
    const cart = await this.cartRepository.findActiveCartByUserId(userIdString as UUID);

    if (!cart) {
      // Create empty cart if none exists
      const newCart = await this.cartRepository.findOrCreateByUserId(userIdString as UUID);
      const formatted = this.cartSanitizer.formatCart(newCart);
      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        formatted,
      );
    }

    const formatted = this.cartSanitizer.formatCart(cart);
    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      formatted,
    );
  }

  async addItem(
    userId: UUID,
    payload: AddCartItemDTO,
  ): Promise<IResponse<FormattedCart>> {
    // Ensure userId is a string UUID, not an object
    const userIdString = typeof userId === 'string' ? userId : (userId as any)?.id || userId;
    const { productId, productVariantId, quantity } = payload;

    // Verify product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(ErrorMessage.NOT_FOUND('Product'));
    }

    // Check inventory
    if (product.trackInventory && product.quantity < quantity) {
      throw new BadRequestException(ErrorMessage.AT_LEAST_ONE_OUT_OF_STOCK);
    }

    // Verify variant if provided
    let variant: ProductVariant | null = null;
    if (productVariantId) {
      variant = await this.productVariantRepository.findById(productVariantId);
      const variantProductId = typeof (variant?.product as any)?.id === 'string' 
        ? (variant?.product as any).id 
        : (variant?.product as any)?.id?.id || (variant?.product as any)?.id;
      if (!variant || variantProductId !== productId) {
        throw new NotFoundException(ErrorMessage.NOT_FOUND('Product variant'));
      }
    }

    // Get or create cart
    const cart = await this.cartRepository.findOrCreateByUserId(userIdString as UUID);
    // Extract cart ID as string (repository methods will also extract, but be explicit here)
    const cartId = typeof cart.id === 'string' ? cart.id : (cart.id as any)?.id || String(cart.id);

    // Check if item already exists in cart (repository will extract again for safety)
    const existingItem = await this.cartItemRepository.findByCartIdAndProductId(
      cartId as UUID,
      productId,
      productVariantId,
    );

    let unitPrice = product.sellingPrice;
    if (variant) {
      unitPrice = variant.sellingPrice || product.sellingPrice;
    }

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (product.trackInventory && product.quantity < newQuantity) {
        throw new BadRequestException(ErrorMessage.AT_LEAST_ONE_OUT_OF_STOCK);
      }

      existingItem.quantity = newQuantity;
      existingItem.unitPrice = unitPrice; // Update price in case it changed
      await this.cartItemRepository.save(existingItem);
    } else {
      // Create new cart item
      const cartItem = this.cartItemRepository.create({
        cart: cartId as any,
        product: productId as any,
        productVariant: productVariantId ? (productVariantId as any) : null,
        quantity,
        unitPrice,
      });
      await this.cartItemRepository.save(cartItem);
    }

    // Reload cart with items
    const updatedCart = await this.cartRepository.findById(cartId, {
      relations: [
        'items',
        'items.product',
        'items.productVariant',
        'items.productVariant.attributes',
      ],
    });

    const formatted = this.cartSanitizer.formatCart(updatedCart);
    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      formatted,
    );
  }

  async updateItem(
    userId: UUID,
    payload: UpdateCartItemDTO,
  ): Promise<IResponse<FormattedCart>> {
    // Ensure userId is a string UUID, not an object
    const userIdString = typeof userId === 'string' ? userId : (userId as any)?.id || userId;
    const { cartItemId, quantity } = payload;

    const cartItem = await this.cartItemRepository.findById(cartItemId, {
      relations: ['cart', 'product'],
    });

    if (!cartItem) {
      throw new NotFoundException(ErrorMessage.NOT_FOUND('Cart item'));
    }

    const cart = cartItem.cart as Cart;
    // Normalize cart.id if it came from relations
    if (cart.id && typeof cart.id !== 'string') {
      cart.id = (cart.id as any)?.id || String(cart.id);
    }
    
    const cartUserId = typeof (cart.user as any) === 'string' 
      ? (cart.user as any) 
      : (cart.user as any)?.id;
    if (cartUserId !== userIdString) {
      throw new BadRequestException(ErrorMessage.ACCESS_DENIED);
    }

    const product = cartItem.product as Product;
    if (product.trackInventory && product.quantity < quantity) {
      throw new BadRequestException(ErrorMessage.AT_LEAST_ONE_OUT_OF_STOCK);
    }

    cartItem.quantity = quantity;
    await this.cartItemRepository.save(cartItem);

    // Extract cart ID as string
    const cartId = typeof cart.id === 'string' ? cart.id : (cart.id as any)?.id || String(cart.id);

    // Reload cart
    const updatedCart = await this.cartRepository.findById(cartId, {
      relations: [
        'items',
        'items.product',
        'items.productVariant',
        'items.productVariant.attributes',
      ],
    });

    const formatted = this.cartSanitizer.formatCart(updatedCart);
    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      formatted,
    );
  }

  async removeItem(
    userId: UUID,
    payload: RemoveCartItemDTO,
  ): Promise<IResponse<FormattedCart>> {
    // Ensure userId is a string UUID, not an object
    const userIdString = typeof userId === 'string' ? userId : (userId as any)?.id || userId;
    const { cartItemId } = payload;

    const cartItem = await this.cartItemRepository.findById(cartItemId, {
      relations: ['cart'],
    });

    if (!cartItem) {
      throw new NotFoundException(ErrorMessage.NOT_FOUND('Cart item'));
    }

    const cart = cartItem.cart as Cart;
    // Normalize cart.id if it came from relations
    if (cart.id && typeof cart.id !== 'string') {
      cart.id = (cart.id as any)?.id || String(cart.id);
    }
    
    const cartUserId = typeof (cart.user as any) === 'string' 
      ? (cart.user as any) 
      : (cart.user as any)?.id;
    if (cartUserId !== userIdString) {
      throw new BadRequestException(ErrorMessage.ACCESS_DENIED);
    }

    await this.cartItemRepository.softDeleteById(cartItem.id);

    // Extract cart ID as string
    const cartId = typeof cart.id === 'string' ? cart.id : (cart.id as any)?.id || String(cart.id);

    // Reload cart
    const updatedCart = await this.cartRepository.findById(cartId, {
      relations: [
        'items',
        'items.product',
        'items.productVariant',
        'items.productVariant.attributes',
      ],
    });

    const formatted = this.cartSanitizer.formatCart(updatedCart);
    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      formatted,
    );
  }

  async clearCart(userId: UUID): Promise<IResponse<{ message: string }>> {
    // Ensure userId is a string UUID, not an object
    const userIdString = typeof userId === 'string' ? userId : (userId as any)?.id || userId;
    const cart = await this.cartRepository.findActiveCartByUserId(userIdString as UUID);

    if (!cart) {
      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        { message: 'Cart is already empty' },
      );
    }

    // Extract cart ID as string
    const cartId = typeof cart.id === 'string' ? cart.id : (cart.id as any)?.id || String(cart.id);
    await this.cartItemRepository.softDeleteByCartId(cartId as UUID);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { message: 'Cart cleared successfully' },
    );
  }

  async checkout(
    userId: UUID,
    payload: CheckoutCartDTO,
  ): Promise<IResponse<any>> {
    // Ensure userId is a string UUID, not an object
    const userIdString = typeof userId === 'string' ? userId : (userId as any)?.id || userId;
    const cart = await this.cartRepository.findActiveCartByUserId(userIdString as UUID);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate all items are still available
    for (const item of cart.items) {
      const product = item.product as Product;
      if (product.trackInventory && product.quantity < item.quantity) {
        throw new BadRequestException(
          `Product "${product.name}" is out of stock`,
        );
      }
    }

    // Convert cart items to order items
    const orderItems = cart.items.map((item) => {
      const product = item.product as Product;
      return {
        productId: product.id,
        productVariantId: item.productVariant
          ? ((item.productVariant as ProductVariant).id as any)
          : undefined,
        quantity: item.quantity,
      };
    });

    // Extract cart ID as string
    const cartId = typeof cart.id === 'string' ? cart.id : (cart.id as any)?.id || String(cart.id);

    // Create order from cart
    const createOrderDTO: CreateOrderDTO = {
      items: orderItems,
      userId: userIdString as UUID,
      cartId: cartId as UUID, // Link cart to order
      couponId: payload.couponId,
      note: payload.note,
      shippingAddress: payload.shippingAddress as OrderShippingAddressDTO,
      paymentData: payload.paymentData,
      inStoreOrder: false,
      _exclusiveCheck: undefined,
      _exclusiveCheck2: undefined,
      _exclusiveCheck3: undefined,
      inStoreOrderData: undefined,
    };

    const orderResult = await this.ordersService.createOrder(createOrderDTO);

    // Soft delete cart items after successful order creation (paranoid delete)
    if (orderResult.success) {
      await this.cartItemRepository.softDeleteByCartId(cartId);
    }

    return orderResult;
  }
}

