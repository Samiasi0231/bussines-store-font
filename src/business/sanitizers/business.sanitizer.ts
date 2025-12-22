import { Injectable } from '@nestjs/common';
import { Business } from '../../entities/business.entity';
import { Address } from '../../entities/address.entity';
import { KycSanitizer } from '../../kyc/sanitizers/kyc.sanitizer';
import { Status } from '../../@common/constants/status.constant';
import { Store } from '../../entities/store.entity';
import { User } from '../../entities/user.entity';
import { BusinessType } from '../../@common/constants/business-type.contant';
import { BusinessCategory } from '../../entities/business-category.entity';

export type BusinessData = {
  id: string;
  userId: string;
  cacNumber?: string;
  logo?: string;
  description?: string;
  name: string;
  proposedName1?: string;
  proposedName2?: string;
  addresses: Partial<Address>[];
  status: Status;
  stores?: Partial<Store>[];
  businessType: BusinessType;
  extraData?: any;
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  subCategory?: {
    id: string;
    name: string;
    description?: string;
  };
  cacCertificateUrl?: string;
  statusReportUrl?: string;
};

@Injectable()
export class BusinessSanitizer {
  constructor(private readonly kycSanitizer: KycSanitizer) {}

  formatBusinessData(business: Business): BusinessData {
    return {
      id: business.id,
      userId: typeof business.user === 'string'
        ? business.user
        : (business.user as User)?.id || '',

      cacNumber: business.cacNumber,
      logo: business.logo,
      description: business.description,
      name: business.name,
      proposedName1: (business as any).proposedName1,
      proposedName2: (business as any).proposedName2,
      status: business.status,

      addresses: business.addresses?.map((address) => ({
        id: address.id,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: (address as any).postalCode,
      })) ?? [],

      stores: business.stores?.map((store) => ({
        id: store.id,
        name: store.name,
      })) ?? [],

      businessType: business.businessType,

      category: business.category
        ? this.formatCategory(business.category)
        : undefined,

      subCategory: business.subCategory
        ? this.formatCategory(business.subCategory)
        : undefined,

      cacCertificateUrl: business.cacCertificateUrl,
      statusReportUrl: business.statusReportUrl,

      extraData: business.extraData ? JSON.parse(JSON.stringify(business.extraData)) : undefined,
    };
  }

  private formatCategory(category: BusinessCategory | string): {
    id: string;
    name: string;
    description?: string;
  } | undefined {
    if (!category) return undefined;


    if (typeof category === 'string') {
      return {
        id: category,
        name: 'Unknown', 
      };
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
    };
  }

  /**
   * Format business data with category relations loaded
   * Use this when you need full category information
   */
  formatBusinessDataWithCategories(business: Business): BusinessData {
    const baseData = this.formatBusinessData(business);


    if (business.category && typeof business.category !== 'string') {
      baseData.category = {
        id: (business.category as BusinessCategory).id,
        name: (business.category as BusinessCategory).name,
        description: (business.category as BusinessCategory).description,
      };
    }

    if (business.subCategory && typeof business.subCategory !== 'string') {
      baseData.subCategory = {
        id: (business.subCategory as BusinessCategory).id,
        name: (business.subCategory as BusinessCategory).name,
        description: (business.subCategory as BusinessCategory).description,
      };
    }

    return baseData;
  }

  /**
   * Format minimal business data (for lists)
   */
  formatBusinessDataMinimal(business: Business): Partial<BusinessData> {
    return {
      id: business.id,
      name: business.name,
      logo: business.logo,
      businessType: business.businessType,
      status: business.status,
      category: business.category
        ? this.formatCategory(business.category)
        : undefined,
      subCategory: business.subCategory
        ? this.formatCategory(business.subCategory)
        : undefined,
    };
  }

  /**
   * Format multiple businesses
   */
  formatBusinessList(businesses: Business[]): BusinessData[] {
    return businesses.map((business) => this.formatBusinessData(business));
  }

  /**
   * Format multiple businesses with categories
   */
  formatBusinessListWithCategories(businesses: Business[]): BusinessData[] {
    return businesses.map((business) =>
      this.formatBusinessDataWithCategories(business),
    );
  }

  /**
   * Format multiple businesses (minimal)
   */
  formatBusinessListMinimal(businesses: Business[]): Partial<BusinessData>[] {
    return businesses.map((business) =>
      this.formatBusinessDataMinimal(business),
    );
  }
}