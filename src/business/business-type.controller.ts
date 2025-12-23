import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { BusinessTypeService } from './business-type.service';
import { UUID } from 'crypto';

@Controller('business-types')
export class BusinessTypeController {
  constructor(private readonly businessTypeService: BusinessTypeService) {}

  /**
   * Get all business types
   * GET /business-types
   */
  @Get()
  async getAllBusinessTypes() {
    return this.businessTypeService.getAllBusinessTypes();
  }

  /**
   * Get business type by ID
   * GET /business-types/:id
   */
  @Get(':id')
  async getBusinessTypeById(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.businessTypeService.getBusinessTypeById(id);
  }

  /**
   * Get business type requirements
   * GET /business-types/:id/requirements
   */
  @Get(':id/requirements')
  async getBusinessTypeRequirements(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.businessTypeService.getBusinessTypeRequirements(id);
  }

  /**
   * Search business types
   * GET /business-types/search?q=term
   */
  @Get('search')
  async searchBusinessTypes(@Query('q') searchTerm: string) {
    return this.businessTypeService.searchBusinessTypes(searchTerm);
  }
}
