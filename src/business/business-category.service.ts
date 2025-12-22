import { Injectable } from '@nestjs/common';
import { BusinessCategoryRepository } from '../repositories/business-category.repository';
import { UUID } from 'crypto';
import { ResponseService } from '../@common/response';

@Injectable()
export class BusinessCategoryService {
  constructor(
    private readonly categoryRepository: BusinessCategoryRepository,
    private readonly responseService: ResponseService,
  ) {}

  /**
   * Get all main categories (categories without parent)
   */
  async getMainCategories() {
    try {
      const categories = await this.categoryRepository.findMainCategories(true);

      return this.responseService.sendSuccess(
        'Main categories retrieved successfully',
        categories,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve main categories',
        error,
      );
    }
  }

  /**
   * Get sub-categories by parent category ID
   */
  async getSubCategories(parentCategoryId: UUID) {
    try {
      const parentCategory = await this.categoryRepository.findActiveById(
        parentCategoryId,
      );

      if (!parentCategory) {
        return this.responseService.sendError(
          'Parent category not found or inactive',
        );
      }

      const subCategories = await this.categoryRepository.findSubCategoriesByParentId(
        parentCategoryId,
        true,
      );

      return this.responseService.sendSuccess(
        'Sub-categories retrieved successfully',
        subCategories,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve sub-categories',
        error,
      );
    }
  }

  /**
   * Get category by ID (used for validation)
   */
  async getCategoryById(categoryId: UUID) {
    return this.categoryRepository.findActiveById(categoryId);
  }

  /**
   * Get category with its sub-categories
   */
  async getCategoryWithSubCategories(categoryId: UUID) {
    try {
      const category = await this.categoryRepository.findWithSubCategories(
        categoryId,
        true,
      );

      if (!category) {
        return this.responseService.sendError('Category not found');
      }

      return this.responseService.sendSuccess(
        'Category retrieved successfully',
        category,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve category',
        error,
      );
    }
  }

  /**
   * Get all categories with their sub-categories (full hierarchy)
   */
  async getAllCategoriesWithSubCategories() {
    try {
      const categories = await this.categoryRepository.findAllWithSubCategories(
        true,
      );

      return this.responseService.sendSuccess(
        'Categories retrieved successfully',
        categories,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve categories',
        error,
      );
    }
  }

  /**
   * Search categories by name
   */
  async searchCategories(searchTerm: string) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return this.responseService.sendError(
          'Search term must be at least 2 characters',
        );
      }

      const categories = await this.categoryRepository.searchByName(
        searchTerm,
        true,
      );

      return this.responseService.sendSuccess(
        'Search results retrieved successfully',
        categories,
      );
    } catch (error) {
      return this.responseService.sendError('Search failed', error);
    }
  }

  /**
   * Get category hierarchy (parent with all sub-categories)
   */
  async getCategoryHierarchy(categoryId: UUID) {
    try {
      const hierarchy = await this.categoryRepository.getCategoryHierarchy(
        categoryId,
      );

      if (!hierarchy.parent) {
        return this.responseService.sendError('Category not found');
      }

      return this.responseService.sendSuccess(
        'Category hierarchy retrieved successfully',
        hierarchy,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve category hierarchy',
        error,
      );
    }
  }

  /**
   * Validate category and sub-category combination
   */
  async validateCategoryPair(categoryId: UUID, subCategoryId?: UUID) {
    const category = await this.categoryRepository.findActiveById(categoryId);
    
    if (!category) {
      return {
        valid: false,
        message: 'Invalid business category',
      };
    }

    if (subCategoryId) {
      const subCategory = await this.categoryRepository.findActiveById(
        subCategoryId,
      );
      
      if (!subCategory) {
        return {
          valid: false,
          message: 'Invalid business sub-category',
        };
      }

      // Verify that sub-category belongs to the specified parent
      const subCategories = await this.categoryRepository.findSubCategoriesByParentId(
        categoryId,
        true,
      );
      
      const isValidPair = subCategories.some(
        (sub) => sub.id === subCategoryId,
      );

      if (!isValidPair) {
        return {
          valid: false,
          message: 'Sub-category does not belong to the specified category',
        };
      }
    }

    return {
      valid: true,
      message: 'Valid category pair',
    };
  }

  /**
   * Get statistics about categories
   */
  async getCategoryStatistics() {
    try {
      const totalMainCategories = await this.categoryRepository.countMainCategories(
        true,
      );
      
      const mainCategories = await this.categoryRepository.findMainCategories(
        true,
      );
      
      let totalSubCategories = 0;
      const categoryBreakdown = [];

      for (const mainCategory of mainCategories) {
        const subCategoryCount = await this.categoryRepository.countSubCategories(
          mainCategory.id as UUID,
          true,
        );
        
        totalSubCategories += subCategoryCount;
        
        categoryBreakdown.push({
          categoryId: mainCategory.id,
          categoryName: mainCategory.name,
          subCategoryCount,
        });
      }

      const stats = {
        totalMainCategories,
        totalSubCategories,
        totalCategories: totalMainCategories + totalSubCategories,
        categoryBreakdown,
      };

      return this.responseService.sendSuccess(
        'Category statistics retrieved successfully',
        stats,
      );
    } catch (error) {
      return this.responseService.sendError(
        'Failed to retrieve category statistics',
        error,
      );
    }
  }
}