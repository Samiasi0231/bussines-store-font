import {
  BadRequestException,
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
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { OrdersService } from '../orders/orders.service';
import {
  CreateOrderDTO,
  ShippingAddressDTO as OrderShippingAddressDTO,
} from '../orders/dtos/order.dto';
import { TransactionService } from '../transaction/transaction.service';
import { PaymentMethod } from '../@common/constants/payment.constant';
import { PaymentIntent } from '../@common/constants/payment-intent.constant';
import { Util } from '../@common/utilities/helpers.utility';

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
    private readonly transactionService: TransactionService,
  ) {}

  async getCart(sessionId: string): Promise<IResponse<FormattedCart>> {
    const cart = await this.cartRepository.findActiveCartBySessionId(sessionId);

    if (!cart) {
      const newCart = await this.cartRepository.findOrCreateBySessionId(sessionId);
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
    sessionId: string,
    payload: AddCartItemDTO,
  ): Promise<IResponse<FormattedCart>> {
    const { productId, productVariantId, quantity } = payload;

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(ErrorMessage.NOT_FOUND('Product'));
    }

    if (product.trackInventory && product.quantity < quantity) {
      throw new BadRequestException(ErrorMessage.AT_LEAST_ONE_OUT_OF_STOCK);
    }

    let variant: ProductVariant | null = null;
    if (productVariantId) {
      variant = await this.productVariantRepository.findById(productVariantId);
      const variantProductId =
        typeof (variant?.product as any)?.id === 'string'
          ? (variant?.product as any).id
          : (variant?.product as any)?.id?.id || (variant?.product as any)?.id;
      if (!variant || variantProductId !== productId) {
        throw new NotFoundException(ErrorMessage.NOT_FOUND('Product variant'));
      }
    }

    const cart = await this.cartRepository.findOrCreateBySessionId(sessionId);
    const cartId =
      typeof cart.id === 'string'
        ? cart.id
        : (cart.id as any)?.id || String(cart.id);

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
      const newQuantity = existingItem.quantity + quantity;
      if (product.trackInventory && product.quantity < newQuantity) {
        throw new BadRequestException(ErrorMessage.AT_LEAST_ONE_OUT_OF_STOCK);
      }

      existingItem.quantity = newQuantity;
      existingItem.unitPrice = unitPrice;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cart: cartId as any,
        product: productId as any,
        productVariant: productVariantId ? (productVariantId as any) : null,
        quantity,
        unitPrice: unitPrice,
      });
      await this.cartItemRepository.save(cartItem);
    }

    const updatedCart = await this.cartRepository.findById(cartId, {
      relations: [
        'items',
        'items.product',
        'items.productVariant',
        'items.productVariant.attributes',
      ],
    });
console.log("updatedCart", updatedCart);
    const formatted = this.cartSanitizer.formatCart(updatedCart);
    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      formatted,
    );
  }

  async updateItem(
    sessionId: string,
    payload: UpdateCartItemDTO,
  ): Promise<IResponse<FormattedCart>> {
    const { cartItemId, quantity } = payload;

    const cartItem = await this.cartItemRepository.findById(cartItemId, {
      relations: ['cart', 'product'],
    });

    if (!cartItem) {
      throw new NotFoundException(ErrorMessage.NOT_FOUND('Cart item'));
    }

    const cart = cartItem.cart as Cart;
    if (cart.id && typeof cart.id !== 'string') {
      cart.id = (cart.id as any)?.id || String(cart.id);
    }

    // Verify cart belongs to this session
    if (cart.sessionId !== sessionId) {
      throw new BadRequestException(ErrorMessage.ACCESS_DENIED);
    }

    const product = cartItem.product as Product;
    if (product.trackInventory && product.quantity < quantity) {
      throw new BadRequestException(ErrorMessage.AT_LEAST_ONE_OUT_OF_STOCK);
    }

    cartItem.quantity = quantity;
    await this.cartItemRepository.save(cartItem);

    const cartId =
      typeof cart.id === 'string'
        ? cart.id
        : (cart.id as any)?.id || String(cart.id);

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
    sessionId: string,
    payload: RemoveCartItemDTO,
  ): Promise<IResponse<FormattedCart>> {
    const { cartItemId } = payload;

    const cartItem = await this.cartItemRepository.findById(cartItemId, {
      relations: ['cart'],
    });

    if (!cartItem) {
      throw new NotFoundException(ErrorMessage.NOT_FOUND('Cart item'));
    }

    const cart = cartItem.cart as Cart;
    if (cart.id && typeof cart.id !== 'string') {
      cart.id = (cart.id as any)?.id || String(cart.id);
    }

    // Verify cart belongs to this session
    if (cart.sessionId !== sessionId) {
      throw new BadRequestException(ErrorMessage.ACCESS_DENIED);
    }

    await this.cartItemRepository.softDeleteById(cartItem.id);

    const cartId =
      typeof cart.id === 'string'
        ? cart.id
        : (cart.id as any)?.id || String(cart.id);

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

  async clearCart(sessionId: string): Promise<IResponse<{ message: string }>> {
    const cart = await this.cartRepository.findActiveCartBySessionId(sessionId);

    if (!cart) {
      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        { message: 'Cart is already empty' },
      );
    }

    const cartId =
      typeof cart.id === 'string'
        ? cart.id
        : (cart.id as any)?.id || String(cart.id);
    await this.cartItemRepository.softDeleteByCartId(cartId as UUID);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { message: 'Cart cleared successfully' },
    );
  }

  async checkout(
    sessionId: string,
    payload: CheckoutCartDTO,
  ): Promise<IResponse<any>> {
    const cart = await this.cartRepository.findActiveCartBySessionId(
      sessionId,
      {
        relations: ['items', 'items.product', 'items.productVariant', 'user'],
      },
    );

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cart.items) {
      const product = item.product as Product;
      if (product.trackInventory && product.quantity < item.quantity) {
        throw new BadRequestException(
          `Product "${product.name}" is out of stock`,
        );
      }
    }

    const subtotal = cart.items.reduce((total, item) => {
      return total + item.quantity * item.unitPrice;
    }, 0);

    const cartId =
      typeof cart.id === 'string'
        ? cart.id
        : (cart.id as any)?.id || String(cart.id);

    // Get customer info from cart user if available, otherwise use payload email or default
    const user = cart.user as any;
    const customerEmail = user?.email || payload.email || 'customer@example.com';
    const customerName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : payload.name || 'Customer';

    if (payload.paymentData.method === PaymentMethod.CHECKOUT) {
      const paymentInitResult =
        await this.transactionService.initiateCheckoutPayment({
          amount: subtotal,
          intent: PaymentIntent.ORDER_PAYMENT,
          customerEmail,
          customerName,
          redirectUrl: payload.paymentData.redirectUrl,
        });

      if (!paymentInitResult.success) {
        throw new BadRequestException('Failed to initialize payment');
      }

      payload.paymentData.reference = paymentInitResult.data.reference;

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

      const createOrderDTO: CreateOrderDTO = {
        items: orderItems,
        userId: user?.id ? (user.id as UUID) : undefined, // userId is optional for anonymous users
        email: user?.id ? undefined : customerEmail, // Use email if no user
        cartId: cartId as UUID,
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
      if (orderResult.success) {
        await this.cartItemRepository.softDeleteByCartId(cartId);
        await this.cartRepository.markCartAsConverted(cartId as UUID);
      }

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        {
          order: orderResult.data,
          payment: {
            checkoutUrl: paymentInitResult.data.checkoutUrl,
            reference: paymentInitResult.data.reference,
            providerReference: paymentInitResult.data.providerReference,
            paymentMethods: paymentInitResult.data.paymentMethods,
          },
        },
      );
    }

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

    const createOrderDTO: CreateOrderDTO = {
      items: orderItems,
      userId: user?.id ? (user.id as UUID) : undefined, // userId is optional for anonymous users
      email: user?.id ? undefined : customerEmail, // Use email if no user
      cartId: cartId as UUID,
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

    if (orderResult.success) {
      await this.cartItemRepository.softDeleteByCartId(cartId);
      await this.cartRepository.markCartAsConverted(cartId as UUID);
    }

    return orderResult;
  }
}
