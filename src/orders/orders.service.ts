import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDTO, GetOrderDTO } from './dtos/order.dto';
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
import { OrderAnalyticsDTO } from './dtos/analytics.dto';
import { OrderItem } from '../entities/order-item.entity';
import { Util } from '../@common/utilities/helpers.utility';
import { QueryUtil } from '../@common/utilities/query.utility';
import { FindOptionsWhere, In } from 'typeorm';

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

        let discountAmount = 0;
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
          throw new BadRequestException(
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

  async getOrderAnalytics(payload: OrderAnalyticsDTO) {
    const {
      businesses = [],
      paymentCompleted,
      products = [],
      productVariants = [],
      sort,
      date,
      stores = [],
      groupBy,
    } = payload;

    const filter: FindOptionsWhere<OrderItem> = {};

    let query = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .where('orderItem.deletedAt IS NULL');

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

    const allowedGroupFields = {
      product: {
        join: { relation: 'orderItem.product', alias: 'product' },
        id: 'product.id',
        name: 'product.name',
        keyLabel: 'productId',
        nameLabel: 'productName',
      },
      business: {
        join: { relation: 'orderItem.business', alias: 'business' },
        id: 'business.id',
        name: 'business.name',
        keyLabel: 'businessId',
        nameLabel: 'businessName',
      },
      store: {
        join: { relation: 'orderItem.store', alias: 'store' },
        id: 'store.id',
        name: 'store.name',
        keyLabel: 'storeId',
        nameLabel: 'storeName',
      },
    };

    const group = allowedGroupFields[groupBy] || allowedGroupFields.product;

    const mainQuery = query
      .innerJoin(group.join.relation, group.join.alias)
      .select(`${group.id}`, group.keyLabel)
      .addSelect(`${group.name}`, group.nameLabel)
      .addSelect('SUM(orderItem.quantity)', 'totalQuantity')
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
      quantity: 'totalQuantity',
    };

    const sortFilter = Util.parseSortParam(sort, sortFieldsMap);

    Object.entries(sortFilter).forEach(
      ([field, direction]: [field: string, direction: number]) => {
        mainQuery.addOrderBy(field, direction === 1 ? 'ASC' : 'DESC');
      },
    );

    const [result, totals] = await Promise.all([
      mainQuery.getRawMany(),
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

    const keyName = `by${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        totals: {
          totalRevenue: Util.toNaira(totals.totalRevenue),
          totalCost: Util.toNaira(totals.totalCost),
          totalProfit: Util.toNaira(totals.totalProfit),
          totalQuantity: Number(totals.totalQuantity) || 0,
        },
        [keyName]: result.map((item) => ({
          id: item[group.keyLabel],
          name: item[group.nameLabel],
          revenue: Util.toNaira(item.revenue),
          cost: Util.toNaira(item.cost),
          profit: Util.toNaira(item.profit),
          quantity: Number(item.quantity) || 0,
        })),
      },
    );
  }
  async getOrders(data: GetOrderDTO) {
    const { page, limit, userId } = data;
    const filter: FindOptionsWhere<Order> = {};

    if (userId) filter.user = userId;

    const { results: orders, pagination } = await this.orderRepository.paginate(
      {
        filter,
        pagination: { page, limit },
      },
    );

    const results = orders.map(this.orderSanitizer.formatOrder);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { results, pagination },
    );
  }
}
