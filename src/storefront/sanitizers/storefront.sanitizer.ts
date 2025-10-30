import { Injectable } from '@nestjs/common';
import { Storefront } from '../../entities/storefront.entity';
import { UUID } from 'crypto';

export type FormattedStorefront = {
  id: string;
  store: string;
  slug: string;
  logo: string;
  banner: string;
  aboutUs: string;
  refundPolicy: string;
  termsOfUse: string;
  email: string;
  phone: string;
  socialHandles?: string[];
};

@Injectable()
export class StorefrontSanitizer {
  constructor() {}

  formatStoreFront(data: Storefront): FormattedStorefront {
    return {
      id: data.id,
      store: data.store as UUID,
      slug: data.slug,
      logo: data.logo,
      banner: data.banner,
      aboutUs: data.aboutUs,
      refundPolicy: data.refundPolicy,
      termsOfUse: data.termsOfUse,
      email: data.email,
      phone: data.phone,
      socialHandles: data.socialHandles,
    };
  }
}
