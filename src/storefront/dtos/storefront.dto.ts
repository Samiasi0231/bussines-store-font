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
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { UUID } from 'crypto';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

// Nested DTOs for configuration objects
export class TextStylesDTO {
  @IsString({ message: 'Font family must be a string' })
  @IsNotEmpty({ message: 'Font family is required' })
  fontFamily: string;

  @IsString({ message: 'Weight must be a string' })
  @IsNotEmpty({ message: 'Weight is required' })
  weight: string;

  @IsString({ message: 'Size must be a string' })
  @IsNotEmpty({ message: 'Size is required' })
  size: string;

  @IsString({ message: 'Color must be a string' })
  @IsNotEmpty({ message: 'Color is required' })
  color: string;

  @IsNumber({}, { message: 'Opacity must be a number' })
  @Min(0, { message: 'Opacity must be at least 0' })
  @Max(100, { message: 'Opacity cannot exceed 100' })
  opacity: number;

  @IsOptional()
  @IsString({ message: 'Text align must be a string' })
  textAlign?: string;

  @IsOptional()
  @IsString({ message: 'Background color must be a string' })
  backgroundColor?: string;

  @IsOptional()
  @IsString({ message: 'Border color must be a string' })
  borderColor?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Corner radius must be a number' })
  cornerRadius?: number;
}

export class NavLinkDTO {
  @IsString({ message: 'Nav link text must be a string' })
  @IsNotEmpty({ message: 'Nav link text is required' })
  text: string;

  @IsOptional()
  @IsString({ message: 'Nav link URL must be a string' })
  url?: string;
}

export class HeaderConfigDTO {
  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  logoUrl?: string;

  @IsOptional()
  @IsArray({ message: 'Nav links must be an array' })
  @ValidateNested({ each: true })
  @Type(() => NavLinkDTO)
  navLinks?: NavLinkDTO[];

  @IsOptional()
  @IsArray({ message: 'Nav link styles must be an array' })
  @ValidateNested({ each: true })
  @Type(() => TextStylesDTO)
  navLinkStyles?: TextStylesDTO[];

  @IsOptional()
  @IsString({ message: 'Cart text must be a string' })
  cartText?: string;

  @IsOptional()
  @IsString({ message: 'Background color must be a string' })
  backgroundColor?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Padding must be a number' })
  padding?: number;
}

export class HeroConfigDTO {
  @IsOptional()
  @IsString({ message: 'Header text must be a string' })
  headerText?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'CTA text must be a string' })
  ctaText?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Hero image URL must be a valid URL' })
  heroImageUrl?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Hero image scale must be a number' })
  heroImageScale?: number;

  @IsOptional()
  @IsString({ message: 'Header text align must be a string' })
  headerTextAlign?: string;

  @IsOptional()
  @IsString({ message: 'Description text align must be a string' })
  descriptionTextAlign?: string;

  @IsOptional()
  @IsString({ message: 'CTA text align must be a string' })
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
  @IsBoolean({ message: 'Collections enabled must be a boolean' })
  enabled: boolean;

  @IsOptional()
  @IsArray({ message: 'Selected collection IDs must be an array' })
  @IsString({ each: true, message: 'Each selected collection ID must be a string' })
  selectedCollectionIds?: string[];
}

export class ProductsConfigDTO {
  @IsBoolean({ message: 'Products enabled must be a boolean' })
  enabled: boolean;
}

export class FooterLinkDTO {
  @IsString({ message: 'Footer link text must be a string' })
  @IsNotEmpty({ message: 'Footer link text is required' })
  text: string;

  @IsOptional()
  @IsString({ message: 'Footer link URL must be a string' })
  url?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Footer link padding must be a number' })
  padding?: number;
}

export class FooterConfigDTO {
  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  logoUrl?: string;

  @IsOptional()
  @IsString({ message: 'Store name must be a string' })
  storeName?: string;

  @IsOptional()
  @IsString({ message: 'Copyright text must be a string' })
  copyrightText?: string;

  @IsOptional()
  @IsString({ message: 'Contact address must be a string' })
  contactAddress?: string;

  @IsOptional()
  @IsPhoneNumber(null, { message: 'Phone number must be valid' })
  phoneNumber?: string;

  @IsOptional()
  @IsArray({ message: 'Product links must be an array' })
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDTO)
  productLinks?: FooterLinkDTO[];

  @IsOptional()
  @IsArray({ message: 'Company links must be an array' })
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDTO)
  companyLinks?: FooterLinkDTO[];

  @IsOptional()
  @IsArray({ message: 'Social links must be an array' })
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
  @IsString({ message: 'Background color must be a string' })
  backgroundColor?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Padding must be a number' })
  padding?: number;
}

export class CreateStorefrontDTO {
  @IsOptional()
  @IsString({ message: 'Slug must be a string' })
  slug?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be valid' })
  logo?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Banner URL must be valid' })
  banner?: string;

  @IsOptional()
  @IsString({ message: 'About Us must be a string' })
  aboutUs?: string;

  @IsOptional()
  @IsString({ message: 'Refund Policy must be a string' })
  refundPolicy?: string;

  @IsOptional()
  @IsString({ message: 'Terms of Use must be a string' })
  termsOfUse?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid' })
  email?: string;

  @IsOptional()
  @IsPhoneNumber(null, { message: 'Phone must be valid' })
  phone?: string;

  @IsOptional()
  @IsArray({ message: 'Social handles must be an array' })
  @IsUrl({}, { each: true, message: 'Each social handle must be a valid URL' })
  socialHandles?: string[];

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

// Pagination DTOs with validation
export class GetStorefrontsDTO extends PaginationDTO {
  @TransformToArray()
  @IsOptional()
  @IsArray({ message: 'Store IDs must be an array' })
  @IsUUID(null, { each: true, message: 'Each store ID must be a valid UUID' })
  store?: UUID[];

  @IsOptional()
  @TransformToArray()
  @IsArray({ message: 'Business IDs must be an array' })
  @IsUUID(null, { each: true, message: 'Each business ID must be a valid UUID' })
  business?: UUID[];

  @IsOptional()
  @TransformToArray()
  @IsArray({ message: 'Slugs must be an array' })
  @IsString({ each: true, message: 'Each slug must be a string' })
  slug?: string[];
}

export class EditStorefrontDTO extends CreateStorefrontDTO {}

export class GetStorefrontBySlugDTO {
  @IsString({ message: 'Slug must be a string' })
  @IsNotEmpty({ message: 'Slug is required' })
  slug: string;
}
