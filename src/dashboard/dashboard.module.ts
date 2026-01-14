// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardSanitizer } from './dasdboard.sanitizer';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, DashboardSanitizer],
})
export class DashboardModule {}