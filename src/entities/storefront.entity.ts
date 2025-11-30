// src/storefront/entities/storefront.entity.ts
import { UUID } from 'crypto';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { Store } from './store.entity';
import { IsNotEmpty } from 'class-validator';

// Type definitions for the configuration objects
export interface NavLink {
  text: string;
  url: string;
}

export interface TextStyles {
  fontFamily: string;
  weight: string;
  size: string;
  color: string;
  opacity: number;
  textAlign?: string;
  backgroundColor?: string;
  borderColor?: string;
  cornerRadius?: number;
}

export interface HeaderConfig {
  logoUrl?: string;
  navLinks?: NavLink[];
  navLinkStyles?: TextStyles[];
  cartText?: string;
  backgroundColor?: string;
}

export interface HeroConfig {
  headerText?: string;
  description?: string;
  ctaText?: string;
  heroImageUrl?: string;
  heroImageScale?: number;
  headerTextAlign?: string;
  descriptionTextAlign?: string;
  ctaTextAlign?: string;
  headerStyles?: TextStyles;
  descriptionStyles?: TextStyles;
  ctaStyles?: TextStyles;
}

export interface CollectionsConfig {
  enabled: boolean;
  selectedCollectionIds?: string[];
}

export interface ProductsConfig {
  enabled: boolean;
}

export interface FooterLink {
  text: string;
  url: string | null;
}

export interface FooterConfig {
  logoUrl?: string;
  storeName?: string;
  copyrightText?: string;
  contactAddress?: string;
  phoneNumber?: string;
  productLinks?: FooterLink[];
  companyLinks?: FooterLink[];
  socialLinks?: FooterLink[];
  copyrightStyles?: TextStyles;
  addressStyles?: TextStyles;
  phoneStyles?: TextStyles;
  backgroundColor?: string;
}

@Entity('storefronts')
export class Storefront extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  id = uuidv7() as UUID;

  @Index()
  @ManyToOne(() => Store, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  @IsNotEmpty()
  store: Store | UUID;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'logo' })
  logo?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'banner' })
  banner?: string;

  @Column({ type: 'text', nullable: true, name: 'about_us' })
  aboutUs?: string;

  @Column({ type: 'text', nullable: true, name: 'refund_policy' })
  refundPolicy?: string;

  @Column({ type: 'text', nullable: true, name: 'terms_of_use' })
  termsOfUse?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'email',
  })
  email?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'phone',
  })
  phone?: string;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'social_handles',
  })
  socialHandles?: string[];

  // New configuration fields
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'header_config',
  })
  headerConfig?: HeaderConfig;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'hero_config',
  })
  heroConfig?: HeroConfig;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'collections_config',
    default: { enabled: true },
  })
  collectionsConfig?: CollectionsConfig;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'products_config',
    default: { enabled: false },
  })
  productsConfig?: ProductsConfig;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'footer_config',
  })
  footerConfig?: FooterConfig;
}
