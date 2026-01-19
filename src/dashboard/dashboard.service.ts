import { Injectable, HttpStatus, Logger } from '@nestjs/common';

import { UUID } from 'crypto';
import { WalletService } from '../wallet/wallet.service';
import { BusinessService } from '../business/business.service';
import { ProductService } from '../product/product.service';
import { OrdersService } from '../orders/orders.service';
import { DashboardSanitizer, FormattedDashboard } from './dasdboard.sanitizer';
import { ResponseService, IResponse } from '../@common/response';
import { SuccessMessage, ErrorMessage } from '../@common/constants/message.constant';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly businessService: BusinessService,
    private readonly productService: ProductService,
    private readonly ordersService: OrdersService,
    private readonly dashboardSanitizer: DashboardSanitizer,
    private readonly responseService: ResponseService,
  ) {}
  async getDashboard(userId: UUID): Promise<IResponse<FormattedDashboard>> {
    try {
      const [hasWallet, business] = await Promise.all([
        this.walletService.checkUserHasWallet(userId),
        this.businessService.getUserBusinessWithStores(userId),
      ]);

      let metrics = {
        totalProducts: 0,
        newCustomersThisWeek: 0,
        ordersThisWeek: 0,
        totalSold: 0,
      };

      if (business?.stores?.length > 0) {
        const storeId = business.stores[0].id;

        const [totalProducts, newCustomersThisWeek, ordersThisWeek, totalSold] =
          await Promise.all([
            this.productService.getStoreProductCount(storeId),
            this.ordersService.getWeeklyCustomersCount(storeId),
            this.ordersService.getWeeklyOrdersCount(storeId),
            this.ordersService.getStoreTotalSales(storeId),
          ]);
        metrics = { totalProducts, newCustomersThisWeek, ordersThisWeek, totalSold };
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
      this.logger.error(`Error fetching dashboard: ${error.message}`, error.stack);
      return this.responseService.sendError(
        ErrorMessage.AN_ERROR_OCCURRED,
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAccountSetup(userId: UUID) {
    try {
      const [hasWallet, business] = await Promise.all([
        this.walletService.checkUserHasWallet(userId),
        this.businessService.getUserBusinessWithStores(userId),
      ]);

      const steps = { registration: true, wallet: hasWallet, business: !!business };
      const completedSteps = Object.values(steps).filter(Boolean).length;

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        { completedSteps, totalSteps: 3, steps },
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return this.responseService.sendError(
        ErrorMessage.AN_ERROR_OCCURRED,
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductCount(userId: UUID) {
    try {
      const business = await this.businessService.getUserBusinessWithStores(userId);
      const count = business?.stores?.[0]?.id
        ? await this.productService.getStoreProductCount(business.stores[0].id)
        : 0;

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        { totalProducts: count },
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return this.responseService.sendError(ErrorMessage.AN_ERROR_OCCURRED, null, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getWeeklyCustomers(userId: UUID) {
    try {
      const business = await this.businessService.getUserBusinessWithStores(userId);
      const count = business?.stores?.[0]?.id
        ? await this.ordersService.getWeeklyCustomersCount(business.stores[0].id)
        : 0;
      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        { newCustomersThisWeek: count },
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return this.responseService.sendError(ErrorMessage.AN_ERROR_OCCURRED, null, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getWeeklyOrders(userId: UUID) {
    try {
      const business = await this.businessService.getUserBusinessWithStores(userId);
      const count = business?.stores?.[0]?.id
        ? await this.ordersService.getWeeklyOrdersCount(business.stores[0].id)
        : 0;

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        { ordersThisWeek: count },
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return this.responseService.sendError(ErrorMessage.AN_ERROR_OCCURRED, null, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async getTotalSales(userId: UUID) {
    try {
      const business = await this.businessService.getUserBusinessWithStores(userId);
      const total = business?.stores?.[0]?.id
        ? await this.ordersService.getStoreTotalSales(business.stores[0].id)
        : 0;

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        { totalSold: total },
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      return this.responseService.sendError(ErrorMessage.AN_ERROR_OCCURRED, null, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
