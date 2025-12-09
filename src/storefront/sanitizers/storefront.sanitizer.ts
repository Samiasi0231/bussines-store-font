import { Injectable } from '@nestjs/common';
import {
  Storefront,
  HeaderConfig,
  HeroConfig,
  CollectionsConfig,
  ProductsConfig,
  FooterConfig,
} from '../../entities/storefront.entity';
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
  headerConfig?: HeaderConfig;
  heroConfig?: HeroConfig;
  collectionsConfig?: CollectionsConfig;
  productsConfig?: ProductsConfig;
  footerConfig?: FooterConfig;
};

@Injectable()
export class StorefrontSanitizer {
  constructor() {}

formatStoreFront(data:  Storefront) {
  return {
    id: data.id,
    store: typeof data.store === 'object'
      ? data.store.id 
      : data.store,    

    slug: data.slug,
    logo: data.logo,
    banner: data.banner,
    aboutUs: data.aboutUs,
    refundPolicy: data.refundPolicy,
    termsOfUse: data.termsOfUse,
    email: data.email,
    phone: data.phone,
    socialHandles: data.socialHandles,
    products: Array.isArray(data.products)
      ? data.products.map((product) => ({
          id: product.id,
          name: product.name ?? null,
          description: product.description ?? null,
          images: product.images ?? [],
        }))
      : [],

    headerConfig: data.headerConfig,
    heroConfig: data.heroConfig,
    collectionsConfig: data.collectionsConfig || { enabled: true },
    productsConfig: data.productsConfig || { enabled: false },
    footerConfig: data.footerConfig,
  };
}


  formatForPublic(data: Storefront): Omit<FormattedStorefront, 'store'> {
    const formatted = this.formatStoreFront(data);
    const { store, ...publicData } = formatted;
    return publicData;
  }

  formatMany(storefronts: Storefront[]): FormattedStorefront[] {
    return storefronts.map((storefront) => this.formatStoreFront(storefront));
  }

  sanitizeForStorage(data: Partial<Storefront>): Partial<Storefront> {
    const sanitized: Partial<Storefront> = {};

    if (data.slug !== undefined) sanitized.slug = data.slug.trim();
    if (data.logo !== undefined) sanitized.logo = data.logo?.trim() || null;
    if (data.banner !== undefined)
      sanitized.banner = data.banner?.trim() || null;
    if (data.aboutUs !== undefined)
      sanitized.aboutUs = data.aboutUs?.trim() || null;
    if (data.refundPolicy !== undefined)
      sanitized.refundPolicy = data.refundPolicy?.trim() || null;
    if (data.termsOfUse !== undefined)
      sanitized.termsOfUse = data.termsOfUse?.trim() || null;
    if (data.email !== undefined)
      sanitized.email = data.email?.trim().toLowerCase() || null;
    if (data.phone !== undefined) sanitized.phone = data.phone?.trim() || null;

    if (data.socialHandles !== undefined) {
      sanitized.socialHandles = data.socialHandles
        ?.filter((handle) => handle.trim())
        .map((handle) => handle.trim());
    }

    if (data.headerConfig !== undefined) {
      sanitized.headerConfig = this.sanitizeHeaderConfig(data.headerConfig);
    }

    if (data.heroConfig !== undefined) {
      sanitized.heroConfig = this.sanitizeHeroConfig(data.heroConfig);
    }

    if (data.collectionsConfig !== undefined) {
      sanitized.collectionsConfig = {
        enabled: Boolean(data.collectionsConfig?.enabled),
        selectedCollectionIds:
          data.collectionsConfig?.selectedCollectionIds?.filter((id) =>
            id.trim(),
          ) || [],
      };
    }

    if (data.productsConfig !== undefined) {
      sanitized.productsConfig = {
        enabled: Boolean(data.productsConfig?.enabled),
      };
    }

    if (data.footerConfig !== undefined) {
      sanitized.footerConfig = this.sanitizeFooterConfig(data.footerConfig);
    }

    return sanitized;
  }

  private sanitizeHeaderConfig(config: HeaderConfig): HeaderConfig {
    return {
      logoUrl: config.logoUrl?.trim() || undefined,
      navLinks: config.navLinks?.map((link) => ({
        text: link.text.trim(),
        url: link.url.trim(),
      })),
      navLinkStyles: config.navLinkStyles,
      cartText: config.cartText?.trim() || undefined,
      backgroundColor: config.backgroundColor?.trim() || undefined,
    };
  }

  private sanitizeHeroConfig(config: HeroConfig): HeroConfig {
    return {
      headerText: config.headerText?.trim() || undefined,
      description: config.description?.trim() || undefined,
      ctaText: config.ctaText?.trim() || undefined,
      heroImageUrl: config.heroImageUrl?.trim() || undefined,
      heroImageScale: config.heroImageScale,
      headerTextAlign: config.headerTextAlign,
      descriptionTextAlign: config.descriptionTextAlign,
      ctaTextAlign: config.ctaTextAlign,
      headerStyles: config.headerStyles,
      descriptionStyles: config.descriptionStyles,
      ctaStyles: config.ctaStyles,
    };
  }

  private sanitizeFooterConfig(config: FooterConfig): FooterConfig {
    return {
      logoUrl: config.logoUrl?.trim() || undefined,
      storeName: config.storeName?.trim() || undefined,
      copyrightText: config.copyrightText?.trim() || undefined,
      contactAddress: config.contactAddress?.trim() || undefined,
      phoneNumber: config.phoneNumber?.trim() || undefined,
      productLinks: config.productLinks?.map((link) => ({
        text: link.text.trim(),
        url: link.url?.trim() || null,
      })),
      companyLinks: config.companyLinks?.map((link) => ({
        text: link.text.trim(),
        url: link.url?.trim() || null,
      })),
      socialLinks: config.socialLinks?.map((link) => ({
        text: link.text.trim(),
        url: link.url?.trim() || null,
      })),
      copyrightStyles: config.copyrightStyles,
      addressStyles: config.addressStyles,
      phoneStyles: config.phoneStyles,
      backgroundColor: config.backgroundColor?.trim() || undefined,
    };
  }
}
