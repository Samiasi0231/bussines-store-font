import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';
import { BusinessType } from '../entities/business-type.entity';
import { UUID } from 'crypto';
import { EntityRepository } from '../@common/database/entity.repository';

@Injectable()
export class BusinessTypeRepository extends EntityRepository<BusinessType> {
  constructor(
    @InjectRepository(BusinessType)
    repository: Repository<BusinessType>,
  ) {
    super(repository);
  }

  /**
   * Find a business type by ID
   */
  async findById(
    id: UUID,
    options?: FindOneOptions<BusinessType>,
  ): Promise<BusinessType | null> {
    return this.findOne({
      where: { id },
      ...options,
    });
  }

  /**
   * Find an active business type by ID
   */
  async findActiveById(id: UUID): Promise<BusinessType | null> {
    return this.findOne({
      where: { id, isActive: true },
    });
  }

  /**
   * Find a business type by name
   */
  async findByName(name: string): Promise<BusinessType | null> {
    return this.createQueryBuilder('business_type')
      .where('LOWER(business_type.name) = LOWER(:name)', {
        name: name.toLowerCase(),
      })
      .getOne();
  }

  /**
   * Find a business type by code
   */
  async findByCode(code: string): Promise<BusinessType | null> {
    return this.createQueryBuilder('business_type')
      .where('LOWER(business_type.code) = LOWER(:code)', {
        code: code.toLowerCase(),
      })
      .getOne();
  }

  /**
   * Find all business types
   */
  async findAll(activeOnly: boolean = true): Promise<BusinessType[]> {
    const query = this.createQueryBuilder('business_type');

    if (activeOnly) {
      query.where('business_type.is_active = :isActive', { isActive: true });
    }

    return query.orderBy('business_type.name', 'ASC').getMany();
  }

  /**
   * Check if a business type exists by name
   */
  async typeExists(name: string): Promise<boolean> {
    const businessType = await this.findByName(name);
    return !!businessType;
  }

  /**
   * Check if a business type exists by code
   */
  async codeExists(code: string): Promise<boolean> {
    const businessType = await this.findByCode(code);
    return !!businessType;
  }

  /**
   * Count business types
   */
  async count(options?: FindManyOptions<BusinessType>): Promise<number> {
    return this.count(options);
  }

  /**
   * Search business types by name
   */
  async searchByName(
    searchTerm: string,
    activeOnly: boolean = true,
  ): Promise<BusinessType[]> {
    const query = this.createQueryBuilder('business_type').where(
      'LOWER(business_type.name) LIKE LOWER(:searchTerm)',
      {
        searchTerm: `%${searchTerm}%`,
      },
    );

    if (activeOnly) {
      query.andWhere('business_type.is_active = :isActive', { isActive: true });
    }

    return query.orderBy('business_type.name', 'ASC').getMany();
  }

  /**
   * Activate a business type
   */
  async activate(id: UUID): Promise<boolean> {
    const result = await this.update(id, { isActive: true });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Deactivate a business type
   */
  async deactivate(id: UUID): Promise<boolean> {
    const result = await this.update(id, { isActive: false });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Bulk activate business types
   */
  async bulkActivate(ids: UUID[]): Promise<number> {
    const result = await this.createQueryBuilder()
      .update(BusinessType)
      .set({ isActive: true })
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }

  /**
   * Bulk deactivate business types
   */
  async bulkDeactivate(ids: UUID[]): Promise<number> {
    const result = await this.createQueryBuilder()
      .update(BusinessType)
      .set({ isActive: false })
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }
}
