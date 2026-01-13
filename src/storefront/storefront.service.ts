// src/storefront/storefront.service.ts
import { Injectable, HttpStatus } from '@nestjs/common';
import slugify from 'slugify';
import { StorefrontRepository } from '../repositories/storefront.repository';
import {
  CreateStorefrontDTO,
  GetStorefrontsDTO,
  EditStorefrontDTO,
} from './dtos/storefront.dto';
import { UUID } from 'crypto';
import { Storefront } from '../entities/storefront.entity';
import { StoreRepository } from '../repositories/store.repository';
import { IResponse, ResponseService } from '../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import {
  FormattedStorefront,
  StorefrontSanitizer,
} from './sanitizers/storefront.sanitizer';
import { In, SelectQueryBuilder } from 'typeorm';
import { isUUID } from 'class-validator';
import { ProductRepository } from '../repositories/product.repository';
import { ProductSanitizer } from '../product/sanitizers/product.sanitizer';
import { ProductImageRepository } from '../repositories/product-image.repository';
import { ProductCollectionRepository } from '../repositories/product-collection.repository';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { EntityType } from '../@common/constants/entity.constant';


@Injectable()
export class StorefrontService {
  private readonly domain = 'bizvantage.store';

  constructor(
    private storefrontRepository: StorefrontRepository,
    private storeRepository: StoreRepository,
    private storefrontSanitizer: StorefrontSanitizer,
    private readonly responseService: ResponseService,
    private readonly productRepository: ProductRepository,
    private readonly productSanitizer: ProductSanitizer,
    private readonly productImageRepository: ProductImageRepository,
     private readonly productCollectionRepository: ProductCollectionRepository,
  private readonly systemSettingsService: SystemSettingsService,
  ) { }

  private normalizeSlug(input: string): string {
    return slugify(input, { lower: true, strict: true });
  }

  async create(
    storeId: UUID,
    payload: CreateStorefrontDTO,
  ): Promise<IResponse<FormattedStorefront>> {
    const store = isUUID(storeId)
      ? await this.storeRepository.findById(storeId)
      : null;

    if (!store)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Store'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const hasStoreFront = await this.storefrontRepository.findOne({
      where: { store: { id: storeId } },
    });

    if (hasStoreFront)
      return this.responseService.sendError(
        ErrorMessage.STORE_FRONT_EXISTS,
        null,
        HttpStatus.CONFLICT,
      );

    let slug = this.normalizeSlug(payload.slug || store.name);

    const existing = await this.storefrontRepository.count({
      where: { slug },
    });

    if (existing) slug = this.normalizeSlug(slug + ` ${existing}`);

    // Sanitize payload before saving
    const sanitizedData = this.storefrontSanitizer.sanitizeForStorage({
      slug,
      logo: payload.logo,
      banner: payload.banner,
      aboutUs: payload.aboutUs,
      refundPolicy: payload.refundPolicy,
      termsOfUse: payload.termsOfUse,
      email: payload.email,
      phone: payload.phone,
      socialHandles: payload.socialHandles,
      headerConfig: payload.headerConfig,
      heroConfig: payload.heroConfig,
      collectionsConfig: payload.collectionsConfig,
      productsConfig: payload.productsConfig,
      footerConfig: payload.footerConfig,
    });

    // Add store relation separately (not through sanitizer)
    const dataToSave = {
      ...sanitizedData,
      store: store,
    };

    const storefront = await this.storefrontRepository.createStrict(
      dataToSave as any,
    );


const defaultProductCollections =
  this.systemSettingsService.getDefaultProductCollections() || [];

// // Safely get the business ID
// console.log('Store business:', store.business); 
// const businessId =
//   typeof store.business === 'string' ? store.business : store.business.id;

// for (const defaultCollection of defaultProductCollections) {
//   const exists = await this.productCollectionRepository.collectionExists(
//     defaultCollection.name,
//     businessId, 
//   );

//   if (!exists) {
//     await this.productCollectionRepository.createStrict({
//       name: defaultCollection.name,
//       description: defaultCollection.description,
//       business: businessId, 
//       createdBy: EntityType.SYSTEM,
//     });
//   }
// }



    // Refetch without relations to avoid circular reference
    const createdStorefront = await this.storefrontRepository.findOne({
      where: { id: storefront.id },
    });

    const data = this.storefrontSanitizer.formatStoreFront(createdStorefront);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
      HttpStatus.CREATED,
    );
  }


  async getStorefront(id: UUID): Promise<IResponse<FormattedStorefront>> {
    const storefront = isUUID(id)
      ? await this.storefrontRepository.findOne({
        where: { id },
      })
      : null;

    if (!storefront)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Storefront'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const data = this.storefrontSanitizer.formatStoreFront(storefront);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  async getStorefrontBySlug(slug: string) {
    const normalizedSlug = this.normalizeSlug(slug);

    const storefront = await this.storefrontRepository.findOne({
      where: { slug: normalizedSlug },
    });

    if (!storefront)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Storefront'),
        null,
        HttpStatus.NOT_FOUND,
      );

    
    const storefrontWithStoreId = await this.storefrontRepository
      .createQueryBuilder('storefront')
      .select('storefront.store_id', 'store_id')
      .where('storefront.slug = :slug', { slug: normalizedSlug })
      .getRawOne();

   
    const storeId = storefrontWithStoreId?.store_id || 
      (typeof storefront.store === 'string' ? storefront.store : storefront.store?.id);

    if (!storeId) {
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Store'),
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    const products = await this.productRepository.find({
      where: {
        store: storeId,
        deletedAt: null,
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });


    const productIds = products.map((p) => p.id);

    const productImages = await this.productImageRepository.find({
      where: {
        product: In(productIds),
      },
    });

    const productsWithImages = products.map((product) => {
      const images = productImages.filter((img) => {
        const imgProductId =
          typeof img.product === 'object' ? img.product.id : img.product;
        return imgProductId === product.id;
      });

      return {
        ...product,
        images,
      };
    });

    const formattedProducts = productsWithImages.map((product) =>
      this.productSanitizer.formatProductForList(product),
    );

    const data = this.storefrontSanitizer.formatStoreFront(storefront);

    const payload = {
      ...data,
      products: formattedProducts,
    };

  return this.responseService.sendSuccess(
  SuccessMessage.OPERATION_SUCCESSFUL,
  {
    ...data,
    products: formattedProducts,
  },
);

  }

  async editStorefront(
    id: UUID,
    update: EditStorefrontDTO,
  ): Promise<IResponse<FormattedStorefront>> {
    // Sanitize update data before saving
    const sanitizedUpdate = this.storefrontSanitizer.sanitizeForStorage(update);

    const storefront = isUUID(id)
      ? await this.storefrontRepository.findbyIdAndUpdate(id, sanitizedUpdate)
      : null;

    if (!storefront)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Storefront'),
        null,
        HttpStatus.NOT_FOUND,
      );

    // Refetch without relations to avoid circular reference
    const updatedStorefront = await this.storefrontRepository.findOne({
      where: { id },
    });

    const data = this.storefrontSanitizer.formatStoreFront(updatedStorefront);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }
async getStorefronts(payload: GetStorefrontsDTO) {
  const {
    business: businesses,
    store: stores,
    slug: slugs,
    page,
    limit,
  } = payload;

  // Ensure single values are treated as arrays
  const storesArray = stores ? (Array.isArray(stores) ? stores : [stores]) : [];
  const slugsArray = slugs ? (Array.isArray(slugs) ? slugs : [slugs]) : [];
  const businessesArray = businesses ? (Array.isArray(businesses) ? businesses : [businesses]) : [];

  const query: SelectQueryBuilder<Storefront> = this.storefrontRepository
    .createQueryBuilder('storefront')
    .where('storefront.deletedAt IS NULL');
  if (storesArray.length > 0 || businessesArray.length > 0) {
    query.innerJoin('storefront.store', 'store');
  }
  if (storesArray.length > 0) {
    query.andWhere('store.id IN (:...stores)', { stores: storesArray });
  }

  if (businessesArray.length > 0) {
    query.innerJoin('store.business', 'business');
    query.andWhere('business.id IN (:...businesses)', { businesses: businessesArray });
  }

  if (slugsArray.length > 0) {
    const normalizedSlugs = slugsArray.map((s) => this.normalizeSlug(s));
    query.andWhere('storefront.slug IN (:...slugs)', { slugs: normalizedSlugs });
  }

  const { results: storefronts, pagination } =
    await this.storefrontRepository.paginateWithQuery({
      query,
      pagination: { page, limit },
    });

  const results = this.storefrontSanitizer.formatMany(storefronts);

  return this.responseService.sendSuccess(
    SuccessMessage.OPERATION_SUCCESSFUL,
    { results, pagination },
  );
}


}
