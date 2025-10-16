import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderDTO } from './dtos/order.dto';
import { UserRepository } from '../repositories/user.repository';
import { IResponse, ResponseService } from '../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import { AddressRepository } from '../repositories/address.repository';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { Order, OrderStatus } from '../entities/order.entity';
import { ProductRepository } from '../repositories/product.repository';
import { UUID } from 'crypto';
import { CouponRepository } from '../repositories/coupon.repository';
import { Status } from '../@common/constants/status.constant';
import { OrderCouponRepository } from '../repositories/order-coupon.repository';
import { FormattedOrder, OrderSanitizer } from './sanitizers/order.sanitizer';
import { UserService } from '../user/user.service';
import { OrderRepository } from '../repositories/order.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly responseService: ResponseService,
    private readonly addressRepository: AddressRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderCouponRepository: OrderCouponRepository,
    private readonly couponRepository: CouponRepository,
    private readonly orderSanitizer: OrderSanitizer,
    private readonly dbTransactionManager: DbTransactionManager,
  ) {}

  async createOrder(payload: CreateOrderDTO) {
    const { items, couponId, paymentMethod, email, note, shippingAddress } =
      payload;
    let { userId } = payload;

    const response = await this.dbTransactionManager.transaction<
      IResponse<FormattedOrder>
    >(async (manager) => {
      const entityManager = manager.entityManager;
      if (email) {
        const createGuestUserRes =
          await this.userService.createOrFetchGuestUser(email, entityManager);

        if (!createGuestUserRes.success) return createGuestUserRes;

        userId = createGuestUserRes.data.id;
      }

      if (userId) {
        const user = await this.userRepository
          .withManager(entityManager)
          .findById(userId);

        if (!user)
          return this.responseService.sendError(
            ErrorMessage.USER_NOT_FOUND,
            null,
            HttpStatus.NOT_FOUND,
          );
      }

      let shippingAddressId: UUID;

      if (shippingAddress) {
        const address = await this.addressRepository
          .withManager(entityManager)
          .createStrict({
            lga: shippingAddress.lga,
            buildingNumber: shippingAddress.buildingNumber,
            city: shippingAddress.city,
            state: shippingAddress.state,
            street: shippingAddress.street,
            country: shippingAddress.country,
            user: userId,
          });

        shippingAddressId = address.id;
      }

      let subtotal = 0;
      let totalDiscountAmount = 0;

      const order = new Order();
      order.shippingAddress = shippingAddressId;
      order.user = userId;
      order.paymentMethod = paymentMethod;
      order.note = note;
      order.subtotal = subtotal;
      order.discountAmount = totalDiscountAmount;
      order.totalAmount = subtotal; //will eventually include tax, etc
      order.payableAmount = order.totalAmount - order.discountAmount;

      entityManager.save(order);

      for (const item of items) {
        const { productId, quantity, couponId } = item;

        const product = await this.productRepository
          .withManager(entityManager)
          .findById(productId, {
            lock: { mode: 'pessimistic_write' },
          });

        if (!product)
          return this.responseService.sendError(
            ErrorMessage.NOT_FOUND('Product'),
            null,
            HttpStatus.NOT_FOUND,
          );

        const {
          costPrice,
          sellingPrice: price,
          quantity: availableQuantity,
        } = product;

        if (availableQuantity < quantity)
          return this.responseService.sendError(
            ErrorMessage.AT_LEAST_ONE_OUT_OF_STOCK,
          );

        let discountAmount = 0;
        const totalItemPrice = quantity * price;
        subtotal += totalItemPrice;

        if (couponId) {
          const coupon = await this.couponRepository
            .withManager(entityManager)
            .findById(couponId, { lock: { mode: 'pessimistic_write' } });

          if (coupon.status !== Status.ACTIVE)
            return this.responseService.sendError(
              ErrorMessage.INVALID_COUPON_CODE(coupon.code || ''),
            );

          //TODO: check usage limit per user

          discountAmount = this.couponRepository.getDiscountAmount({
            coupon,
            amount: totalItemPrice,
          });
        }

        totalDiscountAmount += discountAmount;

        //TODO: add support for product variant
        const orderItem = await this.orderItemRepository
          .withManager(entityManager)
          .createStrict({
            order: order.id,
            product: productId,
            quantity,
            unitCostPrice: costPrice,
            unitPrice: price,
            discountAmount,
            totalPrice: totalItemPrice,
            store: product.store,
          });

        if (discountAmount > 0) {
          await this.orderCouponRepository
            .withManager(entityManager)
            .createStrict({
              order: order.id,
              orderItem: orderItem.id,
              coupon: couponId,
            });
        }
      }

      if (couponId) {
        const coupon = await this.couponRepository
          .withManager(entityManager)
          .findById(couponId, { lock: { mode: 'pessimistic_write' } });

        if (coupon.status !== Status.ACTIVE)
          return this.responseService.sendError(
            ErrorMessage.INVALID_COUPON_CODE(coupon.code || ''),
          );

        //TODO: check usage limit per user

        const discountAmount = this.couponRepository.getDiscountAmount({
          coupon,
          amount: subtotal,
        });

        totalDiscountAmount += discountAmount;
      }

      order.subtotal = subtotal;
      order.discountAmount = totalDiscountAmount;
      order.totalAmount = subtotal; //will eventually include tax, etc
      order.payableAmount = order.totalAmount - order.discountAmount;
      entityManager.save(order);

      const data = this.orderSanitizer.formatOrder(order);

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        data,
        HttpStatus.CREATED,
      );
    });

    return response;
  }

  async updateOrderStatus(id: UUID, status: OrderStatus) {
    await this.orderRepository.update(id, { status });

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
    );
  }
}
