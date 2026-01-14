import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { DashboardRepository } from '../repositories/dashboard.repository';
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
    private readonly dashboardRepo: DashboardRepository,
    private readonly dashboardSanitizer: DashboardSanitizer,
    private readonly responseService: ResponseService,
  ) {}

  async getDashboard(userId: UUID): Promise<IResponse<FormattedDashboard>> {
    try {
      this.logger.log(`Fetching dashboard for user: ${userId}`);

      const [hasWallet, business] = await Promise.all([
        this.dashboardRepo.hasWallet(userId),
        this.dashboardRepo.getBusinessByUser(userId),
      ]);

      this.logger.debug(`Wallet: ${hasWallet}, Business: ${!!business}`);

      let metrics = {
        totalProducts: 0,
        newCustomersThisWeek: 0,
        ordersThisWeek: 0,
        totalSold: 0,
      };

      if (business?.stores?.[0]?.id) {
        const storeId = business.stores[0].id;
        this.logger.debug(`Fetching metrics for store: ${storeId}`);

        const [totalProducts, newCustomersThisWeek, ordersThisWeek, totalSold] =
          await Promise.all([
            this.dashboardRepo.countProducts(storeId),
            this.dashboardRepo.countCustomersThisWeek(storeId),
            this.dashboardRepo.countOrdersThisWeek(storeId),
            this.dashboardRepo.totalSold(storeId),
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
      this.logger.error(
        `Error fetching dashboard: ${error.message}`,
        error.stack,
      );

      return this.responseService.sendError(
        ErrorMessage.AN_ERROR_OCCURRED,
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Individual metric methods for granular access
  async getAccountSetup(userId: UUID) {
    const [hasWallet, business] = await Promise.all([
      this.dashboardRepo.hasWallet(userId),
      this.dashboardRepo.getBusinessByUser(userId),
    ]);

    const steps = {
      registration: true,
      wallet: hasWallet,
      business: !!business,
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        completedSteps,
        totalSteps: 3,
        steps,
      },
      HttpStatus.OK,
    );
  }

  async getProductCount(userId: UUID) {
    const business = await this.dashboardRepo.getBusinessByUser(userId);
    const count = business?.stores?.[0]?.id
      ? await this.dashboardRepo.countProducts(business.stores[0].id)
      : 0;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { totalProducts: count },
      HttpStatus.OK,
    );
  }

  async getWeeklyCustomers(userId: UUID) {
    const business = await this.dashboardRepo.getBusinessByUser(userId);
    const count = business?.stores?.[0]?.id
      ? await this.dashboardRepo.countCustomersThisWeek(business.stores[0].id)
      : 0;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { newCustomersThisWeek: count },
      HttpStatus.OK,
    );
  }

  async getWeeklyOrders(userId: UUID) {
    const business = await this.dashboardRepo.getBusinessByUser(userId);
    const count = business?.stores?.[0]?.id
      ? await this.dashboardRepo.countOrdersThisWeek(business.stores[0].id)
      : 0;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { ordersThisWeek: count },
      HttpStatus.OK,
    );
  }

  async getTotalSales(userId: UUID) {
    const business = await this.dashboardRepo.getBusinessByUser(userId);
    const total = business?.stores?.[0]?.id
      ? await this.dashboardRepo.totalSold(business.stores[0].id)
      : 0;

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { totalSold: total },
      HttpStatus.OK,
    );
  }
}