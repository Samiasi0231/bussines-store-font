import { Injectable } from '@nestjs/common';
import { Business } from '../../entities/business.entity';
import { Address } from '../../entities/address.entity';
import { KycSanitizer } from '../../kyc/sanitizers/kyc.sanitizer';

export type BusinessData = {
  id: string;
  userId: string;
  cacNumber: string;
  logo: string;
  description: string;
  name: string;
  addresses: Partial<Address>[];
};

@Injectable()
export class BusinessSanitizer {
  constructor(private readonly kycSanitizer: KycSanitizer) {}

  formatBusinessData(business: Business): BusinessData {
    return {
      id: business.id,
      userId: String(business.user),
      cacNumber: business.cacNumber,
      logo: business.logo,
      description: business.description,
      name: business.name,
      addresses: business.addresses?.map((address) =>
        this.kycSanitizer.formatAddress(address),
      ),
    };
  }
}
