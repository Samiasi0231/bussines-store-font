import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDTO, GetOrdersDTO } from './dtos/order.dto';
import { UserRepository } from '../repositories/user.repository';
import { IResponse, ResponseService } from '../@common/response';
import {
  ErrorMessage,
  GeneralMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import { AddressRepository } from '../repositories/address.repository';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { ProductRepository } from '../repositories/product.repository';
import { UUID } from 'crypto';
import { CouponRepository } from '../repositories/coupon.repository';
import { Status } from '../@common/constants/status.constant';
import { OrderCouponRepository } from '../repositories/order-coupon.repository';
import {
  FormattedOrderForList,
  OrderSanitizer,
} from './sanitizers/order.sanitizer';
import { UserService } from '../user/user.service';
import { OrderRepository } from '../repositories/order.repository';
import { OrderAnalyticsDTO } from './dtos/analytics.dto';
import { OrderItem } from '../entities/order-item.entity';
import { Util } from '../@common/utilities/helpers.utility';
import { QueryUtil } from '../@common/utilities/query.utility';
import { FindOptionsWhere, In, SelectQueryBuilder } from 'typeorm';
import { Paginated } from '../@common/types/pagination.type';
import { PaymentMethod } from '../@common/constants/payment.constant';
import { TransactionService } from '../transaction/transaction.service';
import { WalletRepository } from '../repositories/wallet.repository';
import { Product } from '../entities/product.entity';
import { Store } from '../entities/store.entity';
import {
  TransactionChannel,
  TransactionPurpose,
} from '../@common/constants/transaction.constant';
import { CreditBusinessWalletDTO } from '../transaction/dtos/transaction.dto';
import { RmqProducerService } from '../@common/rmq/rmq.producer.service';
import { RmqQueue } from '../@common/constants/queues.constant';

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
    private readonly transactionService: TransactionService,
    private readonly walletRepository: WalletRepository,
    private readonly rmqProducerService: RmqProducerService,
  ) {}

  async createOrder(payload: CreateOrderDTO) {
    const {
      items,
      inStoreOrderData,
      couponId,
      paymentData: { method: paymentMethod, reference: paymentReference },
      email,
      note,
      shippingAddress,
      inStoreOrder = false,
    } = payload;
    let { userId } = payload;

    const response = await this.dbTransactionManager.transaction<
      IResponse<FormattedOrderForList>
    >(async (manager) => {
      const entityManager = manager.entityManager;

      const isDuplicatePaymentReference = await this.orderRepository
        .withManager(entityManager)
        .findOne({
          where: { paymentReference },
          lock: { mode: 'pessimistic_write' },
        });

      if (isDuplicatePaymentReference)
        return this.responseService.sendError(
          ErrorMessage.DUPLICATE_PAYMENT,
          null,
          HttpStatus.CONFLICT,
        );

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

      if (shippingAddress && shippingAddress.addressId) {
        const address = await this.addressRepository
          .withManager(entityManager)
          .findById(shippingAddress.addressId);

        shippingAddressId = address.id;
      } else if (shippingAddress && shippingAddress.address) {
        const addressData = shippingAddress.address;
        const address = await this.addressRepository
          .withManager(entityManager)
          .createStrict({
            lga: addressData.lga,
            buildingNumber: addressData.buildingNumber,
            city: addressData.city,
            state: addressData.state,
            street: addressData.street,
            country: addressData.country,
            user: userId,
          });

        shippingAddressId = address.id;
      }

      let subtotal = 0;
      let totalDiscountAmount = 0;

      const order = new Order();
      order.inStoreOrder = inStoreOrder;
      order.inStoreOrderData = inStoreOrder ? inStoreOrderData : null;
      order.shippingAddress = shippingAddressId;
      order.user = userId;
      order.paymentMethod = paymentMethod;
      order.note = note;
      order.subtotal = subtotal;
      order.discountAmount = totalDiscountAmount;
      order.totalAmount = subtotal; //will eventually include tax, etc
      order.payableAmount = order.totalAmount - order.discountAmount;
      const paymentStatus = await this.checkPaymentStatus(
        paymentMethod,
        paymentReference,
      );
      order.paymentStatus = paymentStatus;
      order.paymentReference = paymentReference;
      // Link cart to order if provided
      if (payload.cartId) {
        order.cart = payload.cartId as any;
      }
      entityManager.save(order);

      let generalDiscountAmount = 0;

      if (couponId) {
        const coupon = await this.couponRepository
          .withManager(entityManager)
          .findById(couponId, { lock: { mode: 'pessimistic_write' } });

        if (coupon.status !== Status.ACTIVE)
          throw new BadRequestException(
            ErrorMessage.INVALID_COUPON_CODE(coupon.code || ''),
          );

        //TODO(future): check usage limit per user
        const discountAmount = this.couponRepository.getDiscountAmount({
          coupon,
          amount: subtotal,
        });

        generalDiscountAmount = discountAmount;

        totalDiscountAmount += discountAmount;
      }

      const generalDiscountPerItem = Math.floor(
        totalDiscountAmount / items.length,
      );

      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        const { productId, quantity, couponId } = item;

        const product = await this.productRepository
          .withManager(entityManager)
          .findById(productId, {
            lock: { mode: 'pessimistic_write' },
          });

        if (!product)
          throw new NotFoundException(ErrorMessage.NOT_FOUND('Product'));

        const {
          costPrice,
          sellingPrice: price,
          quantity: availableQuantity,
        } = product;

        if (availableQuantity < quantity && product.trackInventory)
          throw new BadRequestException(ErrorMessage.AT_LEAST_ONE_OUT_OF_STOCK);

        await this.productRepository
          .withManager(entityManager)
          .decreaseQuantity(productId, quantity);

        let discountAmount =
          index !== items.length - 1
            ? generalDiscountPerItem
            : generalDiscountAmount -
              (generalDiscountAmount - index * generalDiscountPerItem);

        const totalItemPrice = quantity * price;
        subtotal += totalItemPrice;

        if (couponId) {
          const coupon = await this.couponRepository
            .withManager(entityManager)
            .findById(couponId, { lock: { mode: 'pessimistic_write' } });

          if (coupon.status !== Status.ACTIVE)
            throw new BadRequestException(
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
            subtotal: totalItemPrice,
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

      order.subtotal = subtotal;
      order.discountAmount = totalDiscountAmount;
      order.totalAmount = subtotal; //will eventually include tax, etc
      order.payableAmount = order.totalAmount - order.discountAmount;
      entityManager.save(order);

      manager.on('committed', () => {
        this.rmqProducerService.publish(RmqQueue.PROCESS_ORDER_PAYMENT, {
          orderId: order.id,
        });
      });

      const data = this.orderSanitizer.formatOrderForList(order);

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        data,
        HttpStatus.CREATED,
      );
    });

    return response;
  }

  async checkPaymentStatus(
    method: PaymentMethod,
    paymentReference: string,
  ): Promise<PaymentStatus> {
    if (method === PaymentMethod.CASH) return Status.PAID;

    if (method === PaymentMethod.CHECKOUT) {
      const status =
        await this.transactionService.checkCheckoutPaymentStatus(
          paymentReference,
        );

      if (status === Status.SUCCESSFUL) return Status.PAID;
    }

    //Future Note: Update logic based on expansion of payment methods and integration of webhook listener for checkout payments
    return Status.FAILED;
  }

  async updateOrderStatus(id: UUID, status: OrderStatus) {
    await this.orderRepository.update(id, { status });

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
    );
  }

  async getOrderAnalytics(payload: OrderAnalyticsDTO) {
    const {
      business: businesses = [],
      paymentCompleted = true,
      product: products = [],
      productVariant: productVariants = [],
      sort,
      date,
      page,
      limit,
      store: stores = [],
      groupBy,
      category: categories = [],
      subCategory: subCategories = [],
    } = payload;

    const filter: FindOptionsWhere<OrderItem> = {};

    let query = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .where('orderItem.deletedAt IS NULL');

    const joinedAliases = new Set<string>();

    function safeInnerJoin(
      query: SelectQueryBuilder<any>,
      relation: string,
      alias: string,
    ) {
      if (!joinedAliases.has(alias)) {
        query.innerJoin(relation, alias);
        joinedAliases.add(alias);
      }
      return query;
    }

    if (stores.length > 0) filter.store = In(stores);
    if (products.length > 0) filter.product = In(products);
    if (productVariants.length > 0) filter.productVariant = In(productVariants);

    if (date) {
      const dateFilter = Util.parseDateFilter(date);
      query = QueryUtil.applyRangeFilter(
        query,
        'orderItem',
        'date',
        dateFilter,
      );
    }

    if (businesses.length > 0) {
      query = safeInnerJoin(query, 'orderItem.store', 'store');
      query = safeInnerJoin(query, 'store.business', 'business');
      query.andWhere('business.id IN (:...businesses)', { businesses });
    }

    if (paymentCompleted !== undefined) {
      query = safeInnerJoin(query, 'orderItem.order', 'order');

      if (paymentCompleted)
        query.andWhere('order.paymentStatus = :status', {
          status: Status.PAID,
        });
      else
        query.andWhere('order.paymentStatus != :status', {
          status: Status.PAID,
        });
    }

    if (subCategories.length > 0) {
      query = safeInnerJoin(query, 'orderItem.product', 'product');
      query.andWhere('product.subCategory IN (:...subCategories)', {
        subCategories,
      });
    }

    if (categories.length > 0) {
      query = safeInnerJoin(query, 'orderItem.product', 'product');
      query = safeInnerJoin(query, 'product.subCategory', 'subCategory');
      query = safeInnerJoin(query, 'subCategory.productCategory', 'category');
      query.andWhere('category.id IN (:...categories)', { categories });
    }

    const failedOrderStatuses: OrderStatus[] = [Status.CANCELLED];

    query = safeInnerJoin(query, 'orderItem.order', 'order');
    query.andWhere('order.status NOT IN (:...failedOrderStatuses)', {
      failedOrderStatuses,
    });

    const allowedGroupFields = {
      product: {
        joins: [{ relation: 'orderItem.product', alias: 'product' }],
        id: 'product.id',
        name: 'product.name',
        keyLabel: 'productId',
        nameLabel: 'productName',
      },
      business: {
        joins: [
          { relation: 'orderItem.store', alias: 'store' },
          { relation: 'store.business', alias: 'business' },
        ],
        id: 'business.id',
        name: 'business.name',
        keyLabel: 'businessId',
        nameLabel: 'businessName',
      },
      store: {
        joins: [{ relation: 'orderItem.store', alias: 'store' }],
        id: 'store.id',
        name: 'store.name',
        keyLabel: 'storeId',
        nameLabel: 'storeName',
      },
    };

    const group = allowedGroupFields[groupBy] || allowedGroupFields.product;

    if (group) {
      group.joins.forEach((j) => {
        query = safeInnerJoin(query, j.relation, j.alias);
      });

      query = query
        .select(`${group.id}`, group.keyLabel)
        .addSelect(`${group.name}`, group.nameLabel)
        .addSelect('SUM(orderItem.quantity)', 'quantity')
        .addSelect('SUM(orderItem.quantity * orderItem.unitPrice)', 'revenue')
        .addSelect('SUM(orderItem.quantity * orderItem.unitCostPrice)', 'cost')
        .addSelect(
          'SUM((orderItem.unitPrice - orderItem.unitCostPrice) * orderItem.quantity)',
          'profit',
        )
        .groupBy(group.id)
        .addGroupBy(group.name);

      const sortFieldsMap = {
        revenue: 'revenue',
        profit: 'profit',
        cost: 'cost',
        quantity: 'quantity',
      };

      const sortFilter = Util.parseSortParam(sort, sortFieldsMap, true);

      Object.entries(sortFilter).forEach(
        ([field, direction]: [field: string, direction: number]) => {
          query.addOrderBy(field, direction === 1 ? 'ASC' : 'DESC');
        },
      );

      if (!sortFilter || Object.keys(sortFilter).length === 0)
        query.addOrderBy(`${group.joins.at(-1)?.alias}.createdAt`, 'DESC');
    }

    type OrderAnalyticsGroupResult = {
      id: string;
      name: string;
      revenue: number;
      cost: number;
      profit: number;
      quantity: number;
    };

    const [{ results, pagination }, totals] = await Promise.all([
      this.orderItemRepository.paginateRaw(query, {
        page,
        limit,
      }) as unknown as Paginated<OrderAnalyticsGroupResult>,
      this.orderItemRepository
        .createQueryBuilder('orderItem')
        .select('SUM(orderItem.quantity)', 'totalQuantity')
        .addSelect(
          'SUM(orderItem.quantity * orderItem.unitPrice)',
          'totalRevenue',
        )
        .addSelect(
          'SUM(orderItem.quantity * orderItem.unitCostPrice)',
          'totalCost',
        )
        .addSelect(
          'SUM((orderItem.unitPrice - orderItem.unitCostPrice) * orderItem.quantity)',
          'totalProfit',
        )
        .where('orderItem.deletedAt IS NULL')
        .getRawOne(),
    ]);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        totals: {
          totalRevenue: Util.toNaira(totals.totalRevenue),
          totalCost: Util.toNaira(totals.totalCost),
          totalProfit: Util.toNaira(totals.totalProfit),
          totalQuantity: Number(totals.totalQuantity) || 0,
        },
        grouped: {
          results: results.map((item) => ({
            id: item[group.keyLabel],
            name: item[group.nameLabel],
            revenue: Util.toNaira(item.revenue),
            cost: Util.toNaira(item.cost),
            profit: Util.toNaira(item.profit),
            quantity: Number(item.quantity) || 0,
          })),
          pagination,
        },
      },
    );
  }

  async getOrders(data: GetOrdersDTO) {
    const {
      page,
      limit,
      date,
      sort,
      status: statuses,
      user: users,
      totalAmount,
      discountAmount,
      subtotal,
      business: businesses,
      inStoreOrder,
    } = data;

    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.shippingAddress', 'shippingAddress')
      .where('order.deletedAt IS NULL');

    if (inStoreOrder !== undefined) {
      query.andWhere('order.inStoreOrder = :inStoreOrder', {
        inStoreOrder,
      });
    }

    if (date) {
      const dateFilter = Util.parseDateFilter(date);
      query = QueryUtil.applyRangeFilter(query, 'order', 'date', dateFilter);
    }

    const sortFieldsMap = {
      date: 'date',
      totalAmount: 'totalAmount',
      subtotal: 'subtotal',
      discountAmount: 'discountAmount',
    };

    const sortFilter = Util.parseSortParam(sort, sortFieldsMap);

    if (users) {
      query.andWhere('user.id IN (:...users)', { users });
    }

    if (statuses?.length > 0) {
      query.andWhere('order.status IN (:...statuses)', { statuses });
    }

    if (discountAmount) {
      const discountFilter = Util.parseNumericRangeFilter(discountAmount);

      query = QueryUtil.applyNumericRangeFilter(
        query,
        'order',
        'discountAmount',
        discountFilter,
      );
    }

    if (totalAmount) {
      const totalAmountFilter = Util.parseNumericRangeFilter(totalAmount);

      query = QueryUtil.applyNumericRangeFilter(
        query,
        'order',
        'totalAmount',
        totalAmountFilter,
      );
    }

    if (subtotal) {
      const subtotalFilter = Util.parseNumericRangeFilter(subtotal);

      query = QueryUtil.applyNumericRangeFilter(
        query,
        'order',
        'subtotal',
        subtotalFilter,
      );
    }

    if (businesses?.length > 0) {
      query
        .innerJoin('order.orderItems', 'orderItem')
        .innerJoin('orderItem.store', 'store')
        .innerJoin('store.business', 'business')
        .andWhere('business.id IN (:...businesses)', { businesses });
    }

    const { results: orders, pagination } =
      await this.orderRepository.paginateWithQuery({
        query,
        pagination: { limit, page },
        sort: sortFilter,
      });

    const results = orders.map((order) =>
      this.orderSanitizer.formatOrderForList(order),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results,
        pagination,
      },
    );
  }

  async getOrder(orderId: string) {
    //TODO: restrict order retrieval to only the user who placed the order or the owner of the business that the purchased product belongs to
    const order = await this.orderRepository.findOne({
      where: { id: orderId as UUID },
      relations: [
        'orderItems',
        'user',
        'orderItems.product',
        'shippingAddress',
      ],
    });

    if (!order)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Order'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const data = this.orderSanitizer.formatOrder(order);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  async processOrderPayment(payload: { orderId: string }) {
    const { orderId } = payload;

    const order = await this.orderRepository.findOne({
      where: { id: orderId as UUID },
    });

    if (!order)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Order'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const paymentReference = order.paymentReference;

    const orderItems = await this.orderItemRepository.find({
      where: { order: order.id },
      relations: ['product.store'],
    });

    for (const orderItem of orderItems) {
      const payableAmount = orderItem.subtotal - orderItem.discountAmount;

      const businessId = ((orderItem.product as Product)?.store as Store)
        ?.business;

      const isDuplicatePayment =
        await this.transactionService.isDuplicateOrderPayment(
          paymentReference,
          order.id,
          orderItem.id,
        );

      if (isDuplicatePayment)
        return this.responseService.sendError(
          ErrorMessage.DUPLICATE_PAYMENT,
          null,
          HttpStatus.CONFLICT,
        );

      const creditPayload: CreditBusinessWalletDTO = {
        amount: payableAmount,
        businessId: businessId as UUID,
        purpose: TransactionPurpose.ORDER_CREDIT,
        channel: TransactionChannel.WALLET,
        narration: GeneralMessage.ORDER_PAYMENT_CREDIT_NARRATION(
          order.id,
          orderItem.id,
        ), //narration can be improved to be more meaningful to the user
        metadata: {
          orderId: order.id,
          orderItemId: orderItem.id,
          externalReference: paymentReference,
        },
      };

      return this.transactionService.creditBusinessWallet({
        businessId: businessId as UUID,
        ...creditPayload,
      });
    }
  }
}
