import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  IsNull,
} from 'typeorm';
import { BusinessCategory } from '../entities/business-category.entity';
import { UUID } from 'crypto';
import { EntityRepository } from '../@common/database/entity.repository';

@Injectable()
export class BusinessCategoryRepository extends EntityRepository<BusinessCategory> {
  constructor(
    @InjectRepository(BusinessCategory)
    repository: Repository<BusinessCategory>,
  ) {
    super(repository);
  }

  /**
   * Find a business category by ID
   */
  async findById(
    id: UUID,
    options?: FindOneOptions<BusinessCategory>,
  ): Promise<BusinessCategory | null> {
    return this.findOne({
      where: { id },
      ...options,
    });
  }

  /**
   * Find an active business category by ID
   */
  async findActiveById(id: UUID): Promise<BusinessCategory | null> {
    return this.findOne({
      where: { id, isActive: true },
    });
  }

  /**
   * Find a business category by name
   */
  async findByName(
    name: string,
    parentCategoryId?: UUID,
  ): Promise<BusinessCategory | null> {
    const query = this.createQueryBuilder('business_category').where(
      'LOWER(business_category.name) = LOWER(:name)',
      {
        name: name.toLowerCase(),
      },
    );

    if (parentCategoryId) {
      // Search for sub-category under specific parent
      query.andWhere(
        'business_category.parent_category_id = :parentCategoryId',
        {
          parentCategoryId,
        },
      );
    } else {
      // Search for main category (no parent)
      query.andWhere('business_category.parent_category_id IS NULL');
    }

    return query.getOne();
  }

  /**
   * Find all main categories (categories without parent)
   */
  async findMainCategories(
    activeOnly: boolean = true,
  ): Promise<BusinessCategory[]> {
    const where: any = { parentCategory: IsNull() };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * Find all sub-categories by parent category ID
   */
  async findSubCategoriesByParentId(
    parentCategoryId: UUID,
    activeOnly: boolean = true,
  ): Promise<BusinessCategory[]> {
    const query = this.createQueryBuilder('business_category').where(
      'business_category.parent_category_id = :parentCategoryId',
      {
        parentCategoryId,
      },
    );

    if (activeOnly) {
      query.andWhere('business_category.is_active = :isActive', {
        isActive: true,
      });
    }

    return query.orderBy('business_category.name', 'ASC').getMany();
  }

  /**
   * Find a category with its sub-categories
   */
  async findWithSubCategories(
    id: UUID,
    activeOnly: boolean = true,
  ): Promise<BusinessCategory | null> {
    const where: any = { id };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.findOne({
      where,
      relations: ['subCategories'],
    });
  }

  /**
   * Find all categories with their sub-categories
   */
  async findAllWithSubCategories(
    activeOnly: boolean = true,
  ): Promise<BusinessCategory[]> {
    const where: any = { parentCategory: IsNull() };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.find({
      where,
      relations: ['subCategories'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Find all categories (main and sub)
   */
  async findAll(
    options?: FindManyOptions<BusinessCategory>,
  ): Promise<BusinessCategory[]> {
    return this.find({
      order: { name: 'ASC' },
      ...options,
    });
  }

  /**
   * Check if a category exists
   */
  async businessCategoryExists(id: UUID): Promise<boolean> {
    const count = await this.count({ where: { id } });
    return count > 0;
  }

  /**
   * Check if an active category exists
   */
  async existsAndActive(id: UUID): Promise<boolean> {
    const count = await this.count({
      where: { id, isActive: true },
    });
    return count > 0;
  }

  /**
   * Count categories
   */
  async count(options?: FindManyOptions<BusinessCategory>): Promise<number> {
    return this.count(options);
  }

  /**
   * Count main categories
   */
  async countMainCategories(activeOnly: boolean = true): Promise<number> {
    const where: any = { parentCategory: IsNull() };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.count({ where });
  }

  /**
   * Count sub-categories by parent
   */
  async countSubCategories(
    parentCategoryId: UUID,
    activeOnly: boolean = true,
  ): Promise<number> {
    const where: any = { parentCategory: { id: parentCategoryId } };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.count({ where });
  }

  /**
   * Search categories by name
   */
  async searchByName(
    searchTerm: string,
    activeOnly: boolean = true,
  ): Promise<BusinessCategory[]> {
    const query = this.createQueryBuilder('category').where(
      'LOWER(category.name) LIKE LOWER(:searchTerm)',
      {
        searchTerm: `%${searchTerm}%`,
      },
    );

    if (activeOnly) {
      query.andWhere('category.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('category.name', 'ASC').getMany();
  }

  /**
   * Activate a category
   */
  async activate(id: UUID): Promise<boolean> {
    const result = await this.update(id, { isActive: true });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Deactivate a category
   */
  async deactivate(id: UUID): Promise<boolean> {
    const result = await this.update(id, { isActive: false });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Bulk activate categories
   */
  async bulkActivate(ids: UUID[]): Promise<number> {
    const result = await this.createQueryBuilder()
      .update(BusinessCategory)
      .set({ isActive: true })
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }

  /**
   * Bulk deactivate categories
   */
  async bulkDeactivate(ids: UUID[]): Promise<number> {
    const result = await this.createQueryBuilder()
      .update(BusinessCategory)
      .set({ isActive: false })
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }

  /**
   * Check if category has sub-categories
   */
  async hasSubCategories(categoryId: UUID): Promise<boolean> {
    const count = await this.count({
      where: { parentCategory: { id: categoryId } },
    });
    return count > 0;
  }

  /**
   * Get category hierarchy (parent with all sub-categories)
   */
  async getCategoryHierarchy(categoryId: UUID): Promise<{
    parent: BusinessCategory | null;
    subCategories: BusinessCategory[];
  }> {
    const parent = await this.findById(categoryId);
    if (!parent) {
      return { parent: null, subCategories: [] };
    }

    const subCategories = await this.findSubCategoriesByParentId(categoryId);

    return { parent, subCategories };
  }

  /**
   * Get all categories grouped by parent
   */
  async getAllGroupedByParent(): Promise<Map<string, BusinessCategory[]>> {
    const allCategories = await this.findAll({
      relations: ['parentCategory'],
    });

    const grouped = new Map<string, BusinessCategory[]>();

    allCategories.forEach((category) => {
      const parentId = category.parentCategory
        ? (category.parentCategory as BusinessCategory).id
        : 'main';

      if (!grouped.has(parentId)) {
        grouped.set(parentId, []);
      }

      grouped.get(parentId)?.push(category);
    });

    return grouped;
  }
}
