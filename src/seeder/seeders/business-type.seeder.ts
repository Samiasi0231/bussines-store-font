import { Injectable, Logger } from '@nestjs/common';
import { BusinessTypeRepository } from '../../repositories/business-type.repository';

export const BusinessTypes = [
  {
    name: 'INCORPORATED_TRUSTEES',
    code: 'INCORPORATED_TRUSTEES',
    description: 'Non-Governmental Organization - Requires at least 2 trustees',
    requirements: {
      needsDirectors: false,
      needsShareholders: false,
      needsTrustees: true,
      minTrustees: 2,
      needsWitness: false,
    },
  },
  {
    name: 'Limited Liability Partnership',
    code: 'LIMITED_LIABILITY_PARTNERSHIP',
    description: 'Limited Liability Company - Requires directors, shareholders, and witness',
    requirements: {
      needsDirectors: true,
      needsShareholders: true,
      needsTrustees: false,
      minTrustees: 0,
      needsWitness: true,
    },
  },
  {
    name: 'Business Name',
    code: 'BUSINESS_NAME',
    description: 'Registered Business Name - Sole proprietorship or partnership',
    requirements: {
      needsDirectors: false,
      needsShareholders: false,
      needsTrustees: false,
      minTrustees: 0,
      needsWitness: false,
    },
  },
  {
    name: 'Company',
    code: 'COMPANY',
    description: 'Enterprise - General business entity',
    requirements: {
      needsDirectors: false,
      needsShareholders: false,
      needsTrustees: false,
      minTrustees: 0,
      needsWitness: false,
    },
  },
  {
    name: 'Limited Partnership',
    code: 'LIMITED_PARTNERSHIP',
    description: 'CAC Verified Business - Already registered with CAC',
    requirements: {
      needsDirectors: false,
      needsShareholders: false,
      needsTrustees: false,
      minTrustees: 0,
      needsWitness: false,
    },
  },
] as const;

@Injectable()
export class BusinessTypeSeeder {
  private readonly logger = new Logger(BusinessTypeSeeder.name);

  constructor(
    private readonly businessTypeRepository: BusinessTypeRepository,
  ) {}

  async seed() {
    this.logger.log('Starting business type seeding...');

    for (const businessType of BusinessTypes) {
      const name = businessType.name;
      const code = businessType.code;

      const exists = await this.businessTypeRepository.codeExists(code);

      if (!exists) {
        await this.businessTypeRepository.createStrict({
          name,
          code,
          description: businessType.description,
          requirements: businessType.requirements,
          isActive: true,
        });
        this.logger.log(`Seeded business type: ${name} (${code})`);
      } else {
        this.logger.log(`Business type already exists: ${name} (${code})`);
      }
    }
  }
}