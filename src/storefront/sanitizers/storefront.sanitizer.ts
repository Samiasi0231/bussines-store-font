import { Injectable } from '@nestjs/common';
import {
  Storefront,
  HeaderConfig,
  HeroConfig,
  CollectionsConfig,
  ProductsConfig,
  FooterConfig,
  NavLink,
  TextStyles,
  FooterLink,
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
        ?.filter((handle) => handle?.trim())
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
          data.collectionsConfig?.selectedCollectionIds
            ?.filter((id) => id?.trim())
            .map((id) => id.trim()) || [],
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
    const sanitized: HeaderConfig = {};

    if (config.logoUrl !== undefined) {
      sanitized.logoUrl = config.logoUrl?.trim() || undefined;
    }

    if (config.navLinks !== undefined) {
      sanitized.navLinks = config.navLinks?.map((link) => ({
        text: link.text?.trim() || '',
        url: link.url ? link.url.trim() : undefined,
      }));
    }

    if (config.navLinkStyles !== undefined) {
      sanitized.navLinkStyles = config.navLinkStyles?.map((style) =>
        this.sanitizeTextStyles(style),
      );
    }

    if (config.cartText !== undefined) {
      sanitized.cartText = config.cartText?.trim() || undefined;
    }

    if (config.backgroundColor !== undefined) {
      sanitized.backgroundColor = config.backgroundColor?.trim() || undefined;
    }

    if (config.padding !== undefined) {
      sanitized.padding = config.padding;
    }

    return sanitized;
  }

  private sanitizeHeroConfig(config: HeroConfig): HeroConfig {
    const sanitized: HeroConfig = {};

    if (config.headerText !== undefined) {
      sanitized.headerText = config.headerText?.trim() || undefined;
    }

    if (config.description !== undefined) {
      sanitized.description = config.description?.trim() || undefined;
    }

    if (config.ctaText !== undefined) {
      sanitized.ctaText = config.ctaText?.trim() || undefined;
    }

    if (config.heroImageUrl !== undefined) {
      sanitized.heroImageUrl = config.heroImageUrl?.trim() || undefined;
    }

    if (config.heroImageScale !== undefined) {
      sanitized.heroImageScale = config.heroImageScale;
    }

    if (config.headerTextAlign !== undefined) {
      sanitized.headerTextAlign = config.headerTextAlign;
    }

    if (config.descriptionTextAlign !== undefined) {
      sanitized.descriptionTextAlign = config.descriptionTextAlign;
    }

    if (config.ctaTextAlign !== undefined) {
      sanitized.ctaTextAlign = config.ctaTextAlign;
    }

    if (config.headerStyles !== undefined) {
      sanitized.headerStyles = this.sanitizeTextStyles(config.headerStyles);
    }

    if (config.descriptionStyles !== undefined) {
      sanitized.descriptionStyles = this.sanitizeTextStyles(
        config.descriptionStyles,
      );
    }

    if (config.ctaStyles !== undefined) {
      sanitized.ctaStyles = this.sanitizeTextStyles(config.ctaStyles);
    }

    return sanitized;
  }

  private sanitizeFooterConfig(config: FooterConfig): FooterConfig {
    const sanitized: FooterConfig = {};

    if (config.logoUrl !== undefined) {
      sanitized.logoUrl = config.logoUrl?.trim() || undefined;
    }

    if (config.storeName !== undefined) {
      sanitized.storeName = config.storeName?.trim() || undefined;
    }

    if (config.copyrightText !== undefined) {
      sanitized.copyrightText = config.copyrightText?.trim() || undefined;
    }

    if (config.contactAddress !== undefined) {
      sanitized.contactAddress = config.contactAddress?.trim() || undefined;
    }

    if (config.phoneNumber !== undefined) {
      sanitized.phoneNumber = config.phoneNumber?.trim() || undefined;
    }

    if (config.backgroundColor !== undefined) {
      sanitized.backgroundColor = config.backgroundColor?.trim() || undefined;
    }

    if (config.padding !== undefined) {
      sanitized.padding = config.padding;
    }

    // Helper function to sanitize footer links
    const sanitizeFooterLinks = (links: FooterLink[] = []) =>
      links.map((link) => ({
        text: link.text?.trim() || '',
        url: link.url ? link.url.trim() : undefined,
        padding: link.padding,
      }));

    if (config.productLinks !== undefined) {
      sanitized.productLinks = sanitizeFooterLinks(config.productLinks);
    }

    if (config.companyLinks !== undefined) {
      sanitized.companyLinks = sanitizeFooterLinks(config.companyLinks);
    }

    if (config.socialLinks !== undefined) {
      sanitized.socialLinks = sanitizeFooterLinks(config.socialLinks);
    }

    if (config.copyrightStyles !== undefined) {
      sanitized.copyrightStyles = this.sanitizeTextStyles(
        config.copyrightStyles,
      );
    }

    if (config.addressStyles !== undefined) {
      sanitized.addressStyles = this.sanitizeTextStyles(config.addressStyles);
    }

    if (config.phoneStyles !== undefined) {
      sanitized.phoneStyles = this.sanitizeTextStyles(config.phoneStyles);
    }

    return sanitized;
  }

  private sanitizeTextStyles(styles: TextStyles): TextStyles {
    if (!styles) return styles;

    const sanitized: TextStyles = { ...styles };

    // Sanitize required fields
    sanitized.fontFamily = styles.fontFamily?.trim() || '';
    sanitized.weight = styles.weight?.trim() || '';
    sanitized.size = styles.size?.trim() || '';
    sanitized.color = styles.color?.trim() || '';
    sanitized.opacity = styles.opacity || 100;

    // Sanitize optional fields
    if (styles.textAlign !== undefined) {
      sanitized.textAlign = styles.textAlign?.trim() || undefined;
    }

    if (styles.backgroundColor !== undefined) {
      sanitized.backgroundColor = styles.backgroundColor?.trim() || undefined;
    }

    if (styles.borderColor !== undefined) {
      sanitized.borderColor = styles.borderColor?.trim() || undefined;
    }

    if (styles.cornerRadius !== undefined) {
      sanitized.cornerRadius = styles.cornerRadius;
    }

    return sanitized;
  }
}
