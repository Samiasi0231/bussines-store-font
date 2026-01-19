import { Injectable } from '@nestjs/common';

export type FormattedDashboard = {
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
};

@Injectable()
export class DashboardSanitizer {
  formatDashboard(data: {
    hasWallet: boolean;
    hasBusiness: boolean;
    metrics: {
      totalProducts: number;
      newCustomersThisWeek: number;
      ordersThisWeek: number;
      totalSold: number;
    };
  }): FormattedDashboard {
    const steps = {
      registration: true,
      wallet: data.hasWallet,
      business: data.hasBusiness,
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;

    return {
      accountSetup: {
        completedSteps,
        totalSteps: 3,
        steps,
      },
      cards: data.metrics,
    };
  }
}