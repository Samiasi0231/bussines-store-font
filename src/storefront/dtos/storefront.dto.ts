import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsPhoneNumber,
  IsUrl,
  IsUUID,
  IsObject,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { UUID } from 'crypto';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

// Nested DTOs for configuration objects
export class TextStylesDTO {
  @IsString()
  fontFamily: string;

  @IsString()
  weight: string;

  @IsString()
  size: string;

  @IsString()
  color: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  opacity: number;

  @IsOptional()
  @IsString()
  textAlign?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  borderColor?: string;

  @IsOptional()
  @IsNumber()
  cornerRadius?: number;
}

export class NavLinkDTO {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  url?: string;
}

export class HeaderConfigDTO {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavLinkDTO)
  navLinks?: NavLinkDTO[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextStylesDTO)
  navLinkStyles?: TextStylesDTO[];

  @IsOptional()
  @IsString()
  cartText?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsNumber()
  padding?: number;
}

export class HeroConfigDTO {
  @IsOptional()
  @IsString()
  headerText?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsUrl()
  heroImageUrl?: string;

  @IsOptional()
  @IsNumber()
  heroImageScale?: number;

  @IsOptional()
  @IsString()
  headerTextAlign?: string;

  @IsOptional()
  @IsString()
  descriptionTextAlign?: string;

  @IsOptional()
  @IsString()
  ctaTextAlign?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextStylesDTO)
  headerStyles?: TextStylesDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextStylesDTO)
  descriptionStyles?: TextStylesDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextStylesDTO)
  ctaStyles?: TextStylesDTO;
}

export class CollectionsConfigDTO {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedCollectionIds?: string[];
}

export class ProductsConfigDTO {
  @IsBoolean()
  enabled: boolean;
}

export class FooterLinkDTO {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsNumber()
  padding?: number;
}

export class FooterConfigDTO {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  copyrightText?: string;

  @IsOptional()
  @IsString()
  contactAddress?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDTO)
  productLinks?: FooterLinkDTO[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDTO)
  companyLinks?: FooterLinkDTO[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDTO)
  socialLinks?: FooterLinkDTO[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TextStylesDTO)
  copyrightStyles?: TextStylesDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextStylesDTO)
  addressStyles?: TextStylesDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextStylesDTO)
  phoneStyles?: TextStylesDTO;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsNumber()
  padding?: number;
}

export class CreateStorefrontDTO {
  @IsString()
  slug: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsUrl()
  banner?: string;

  @IsOptional()
  @IsString()
  aboutUs?: string;

  @IsOptional()
  @IsString()
  refundPolicy?: string;

  @IsOptional()
  @IsString()
  termsOfUse?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  socialHandles?: string[];

  // New configuration fields
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HeaderConfigDTO)
  headerConfig?: HeaderConfigDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HeroConfigDTO)
  heroConfig?: HeroConfigDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CollectionsConfigDTO)
  collectionsConfig?: CollectionsConfigDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductsConfigDTO)
  productsConfig?: ProductsConfigDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FooterConfigDTO)
  footerConfig?: FooterConfigDTO;
}

export class GetStorefrontsDTO extends PaginationDTO {
  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  store?: UUID[];

  @IsOptional()
  @TransformToArray()
  @IsArray()
  @IsUUID(null, { each: true })
  business?: UUID[];

  @IsOptional()
  @TransformToArray()
  @IsArray()
  @IsString({ each: true })
  slug?: string[];
}

export class EditStorefrontDTO {
  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsUrl()
  banner?: string;

  @IsOptional()
  @IsString()
  aboutUs?: string;

  @IsOptional()
  @IsString()
  refundPolicy?: string;

  @IsOptional()
  @IsString()
  termsOfUse?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  socialHandles?: string[];

  // New configuration fields
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HeaderConfigDTO)
  headerConfig?: HeaderConfigDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HeroConfigDTO)
  heroConfig?: HeroConfigDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CollectionsConfigDTO)
  collectionsConfig?: CollectionsConfigDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductsConfigDTO)
  productsConfig?: ProductsConfigDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FooterConfigDTO)
  footerConfig?: FooterConfigDTO;
}

export class GetStorefrontBySlugDTO {
  @IsString()
  slug: string;
}
