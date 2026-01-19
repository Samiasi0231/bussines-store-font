
import { IsOptional } from 'class-validator';

export class DashboardMetricsResponseDTO {
  accountSetup: {
    completedSteps: number;
    totalSteps: number;
    steps: {
      registration: boolean;
      wallet: boolean;
      business: boolean;
    };
  };

  cards: {
    totalProducts: number;
    newCustomersThisWeek: number;
    ordersThisWeek: number;
    totalSold: number;
  };
}

export class GetDashboardQueryDTO {
  @IsOptional()
  storeId?: string;
}