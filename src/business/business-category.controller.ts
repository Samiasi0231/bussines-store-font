import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { BusinessCategoryService } from './business-category.service';
import { UUID } from 'crypto';

@Controller('business-categories')
export class BusinessCategoryController {
  constructor(
    private readonly businessCategoryService: BusinessCategoryService
  ) {}

  @Get()
  async getMainCategories() {
    return this.businessCategoryService.getMainCategories();
  }

  @Get(':parentCategoryId/sub-categories')
  async getSubCategories(
    @Param('parentCategoryId', ParseUUIDPipe) parentCategoryId: UUID
  ) {
    return this.businessCategoryService.getSubCategories(parentCategoryId);
  }
}