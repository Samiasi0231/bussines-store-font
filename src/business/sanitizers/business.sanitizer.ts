import { Injectable } from '@nestjs/common';
import { Business } from '../../entities/business.entity';
import { Address } from '../../entities/address.entity';
import { KycSanitizer } from '../../kyc/sanitizers/kyc.sanitizer';
import { Status } from '../../@common/constants/status.constant';
import { Store } from '../../entities/store.entity';
import { User } from '../../entities/user.entity';
import { BusinessType } from '../../@common/constants/business-type.contant';

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

      // Safely stringify extraData to avoid circular references
      extraData: business.extraData ? JSON.parse(JSON.stringify(business.extraData)) : undefined,
    };
  }
}
