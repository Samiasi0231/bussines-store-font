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
      // Remove relations entirely - we don't need them
    });

    if (!storefront)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Storefront'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const storeId = storefront.store;

    // const products = await this.productRepository.find({
    //   where: {
    //     store: storeId,
    //     deletedAt: null,
    //   },
    //   order: { createdAt: 'DESC' },
    //   take: 100,
    // });

    const products = await this.productRepository.find({
  where: {
    storefrontId: storefront.id, 
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
      payload,
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

    const query: SelectQueryBuilder<Storefront> = this.storefrontRepository
      .createQueryBuilder('storefront')
      .where('storefront.deletedAt IS NULL');

    if (stores?.length > 0) {
      query.andWhere('storefront.store IN (:...stores)', { stores });
    }

    if (slugs?.length > 0) {
      // Normalize slugs before querying
      const normalizedSlugs = slugs.map((s) => this.normalizeSlug(s));
      query.andWhere('storefront.slug IN (:...slugs)', {
        slugs: normalizedSlugs,
      });
    }

    if (businesses?.length > 0) {
      query
        .innerJoin('storefront.store', 'store')
        .innerJoin('store.business', 'business')
        .andWhere('business.id IN (:...businesses)', { businesses });
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
