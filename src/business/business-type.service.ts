import { Injectable } from '@nestjs/common';
import { BusinessTypeRepository } from '../repositories/business-type.repository';
import { UUID } from 'crypto';
import { ResponseService } from '../@common/response';

@Injectable()
export class BusinessTypeService {
  constructor(
    private readonly businessTypeRepository: BusinessTypeRepository,
    private readonly responseService: ResponseService,
  ) {}

  /**
   * Get all business types
   */
  async getAllBusinessTypes() {
    try {
      const businessTypes = await this.businessTypeRepository.findAll(true);

      return this.responseService.sendSuccess(
        'Business types retrieved successfully',
        businessTypes,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve business types',
        error,
      );
    }
  }

  /**
   * Get business type by ID
   */
  async getBusinessTypeById(id: UUID) {
    try {
      const businessType = await this.businessTypeRepository.findActiveById(id);

      if (!businessType) {
        return this.responseService.sendError('Business type not found');
      }

      return this.responseService.sendSuccess(
        'Business type retrieved successfully',
        businessType,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve business type',
        error,
      );
    }
  }

  /**
   * Get business type by code
   */
  async getBusinessTypeByCode(code: string) {
    try {
      const businessType = await this.businessTypeRepository.findByCode(code);

      if (!businessType || !businessType.isActive) {
        return this.responseService.sendError(
          'Business type not found or inactive',
        );
      }

      return this.responseService.sendSuccess(
        'Business type retrieved successfully',
        businessType,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve business type',
        error,
      );
    }
  }

  /**
   * Get business type requirements
   */
  async getBusinessTypeRequirements(id: UUID) {
    try {
      const businessType = await this.businessTypeRepository.findActiveById(id);

      if (!businessType) {
        return this.responseService.sendError('Business type not found');
      }

      return this.responseService.sendSuccess(
        'Business type requirements retrieved successfully',
        {
          businessType: businessType.name,
          code: businessType.code,
          requirements: businessType.requirements,
        },
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve business type requirements',
        error,
      );
    }
  }

  /**
   * Search business types by name
   */
  async searchBusinessTypes(searchTerm: string) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return this.responseService.sendError(
          'Search term must be at least 2 characters',
        );
      }

      const businessTypes = await this.businessTypeRepository.searchByName(
        searchTerm,
        true,
      );

      return this.responseService.sendSuccess(
        'Search results retrieved successfully',
        businessTypes,
      );
    } catch (error) {
      return this.responseService.sendError('Search failed', error);
    }
  }
}
