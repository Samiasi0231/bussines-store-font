import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { BusinessRepository } from '../repositories/business.repository';
import { UserRepository  } from '../repositories/user.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { ProductRepository } from '../repositories/product.repository';
import { OrderRepository } from '../repositories/order.repository';
import { ResponseService, IResponse } from '../@common/response';
import {
  SuccessMessage,
  ErrorMessage,
} from '../@common/constants/message.constant';
import {
  DashboardSanitizer,
  FormattedDashboard,
} from './dasdboard.sanitizer';
import { UUID } from 'crypto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly businessRepo: BusinessRepository,
    private readonly walletRepo: WalletRepository,
    private readonly productRepo: ProductRepository,
    private readonly orderRepo: OrderRepository,
    private readonly dashboardSanitizer: DashboardSanitizer,
    private readonly responseService: ResponseService,
  ) {}
  async getDashboard(userId: UUID): Promise<IResponse<FormattedDashboard>> {
    try {
      const [hasWallet, business] = await Promise.all([
        this.walletRepo.existsByUserId(userId),
        this.businessRepo.findByUserWithStores(userId),
      ]);

      let metrics = {
        totalProducts: 0,
        newCustomersThisWeek: 0,
        ordersThisWeek: 0,
        totalSold: 0,
      };

      if (business?.stores?.length) {
        const storeId = business.stores[0].id;

        const [
          totalProducts,
          newCustomersThisWeek,
          ordersThisWeek,
          totalSold,
        ] = await Promise.all([
          this.productRepo.countByStore(storeId),
          this.orderRepo.countUniqueCustomersThisWeek(storeId),
          this.orderRepo.countOrdersThisWeek(storeId),
          this.orderRepo.calculateTotalSales(storeId),
        ]);

        metrics = {
          totalProducts,
          newCustomersThisWeek,
          ordersThisWeek,
          totalSold,
        };
      }

      const data = this.dashboardSanitizer.formatDashboard({
        hasWallet,
        hasBusiness: !!business,
        metrics,
      });

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        data,
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return this.responseService.sendError(
        ErrorMessage.AN_ERROR_OCCURRED,
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getAccountSetup(userId: UUID) {
    const [hasAccount,hasWallet, business] = await Promise.all([
     this.userRepo.existsById(userId),
      this.walletRepo.existsByUserId(userId),
      this.businessRepo.findByUserWithStores(userId),
    ]);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {hasAccount,
        hasWallet,
        hasBusiness: !!business,
      },
      HttpStatus.OK,
    );
  }

  async getProductCount(userId: UUID) {
    const business = await this.businessRepo.findByUserWithStores(userId);

    const count = business?.stores?.length
      ? await this.productRepo.countByStore(business.stores[0].id)
      : 0;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { totalProducts: count },
      HttpStatus.OK,
    );
  }
  async getWeeklyCustomers(userId: UUID) {
    const business = await this.businessRepo.findByUserWithStores(userId);

    const count = business?.stores?.length
      ? await this.orderRepo.countUniqueCustomersThisWeek(
          business.stores[0].id,
        )
      : 0;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { newCustomersThisWeek: count },
      HttpStatus.OK,
    );
  }
  async getWeeklyOrders(userId: UUID) {
    const business = await this.businessRepo.findByUserWithStores(userId);

    const count = business?.stores?.length
      ? await this.orderRepo.countOrdersThisWeek(business.stores[0].id)
      : 0;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { ordersThisWeek: count },
      HttpStatus.OK,
    );
  }


  async getTotalSales(userId: UUID) {
    const business = await this.businessRepo.findByUserWithStores(userId);

    const total = business?.stores?.length
      ? await this.orderRepo.calculateTotalSales(business.stores[0].id)
      : 0;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { totalSold: total },
      HttpStatus.OK,
    );
  }
}
