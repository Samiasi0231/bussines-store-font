import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';

@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getDashboard(@User() user: UserProfile) {
    this.logger.log(`Dashboard request from user: ${user.id}`);
    return this.dashboardService.getDashboard(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('account-setup')
  async getAccountSetup(@User() user: UserProfile) {
    return this.dashboardService.getAccountSetup(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('products/count')
  async getProductCount(@User() user: UserProfile) {
    return this.dashboardService.getProductCount(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customers/weekly')
  async getWeeklyCustomers(@User() user: UserProfile) {
    return this.dashboardService.getWeeklyCustomers(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/weekly')
  async getWeeklyOrders(@User() user: UserProfile) {
    return this.dashboardService.getWeeklyOrders(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sales/total')
  async getTotalSales(@User() user: UserProfile) {
    return this.dashboardService.getTotalSales(user.id);
  }
}