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
import { SelectQueryBuilder } from 'typeorm';
import { isUUID } from 'class-validator';

@Injectable()
export class StorefrontService {
  private readonly domain = 'bizvantage.store';

  constructor(
    private storefrontRepository: StorefrontRepository,
    private storeRepository: StoreRepository,
    private storefrontSanitizer: StorefrontSanitizer,
    private readonly responseService: ResponseService,
  ) {}

  private normalizeSlug(input: string): string {
    return slugify(input, { lower: true, strict: true });
  }

  async create(
    storeId: UUID,
    payload: CreateStorefrontDTO,
  ): Promise<IResponse<FormattedStorefront>> {
    const {
      logo,
      banner,
      aboutUs,
      refundPolicy,
      termsOfUse,
      email,
      phone,
      socialHandles,
    } = payload;

    let { slug } = payload;

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
      where: { store: storeId },
    });

    if (hasStoreFront)
      return this.responseService.sendError(
        ErrorMessage.STORE_FRONT_EXISTS,
        null,
        HttpStatus.CONFLICT,
      );

    slug = this.normalizeSlug(slug || store.name);

    const existing = await this.storefrontRepository.count({
      where: { slug },
    });

    if (existing) slug = this.normalizeSlug(slug + ` ${existing}`);

    const storefront = await this.storefrontRepository.createStrict({
      store: storeId,
      slug,
      logo,
      banner,
      aboutUs,
      refundPolicy,
      termsOfUse,
      email,
      phone,
      socialHandles,
    });

    const data = this.storefrontSanitizer.formatStoreFront(storefront);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
      HttpStatus.CREATED,
    );
  }

  async getStorefront(id: UUID) {
    const storefront = isUUID(id)
      ? await this.storefrontRepository.findById(id)
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

  async editStorefront(
    id: UUID,
    update: EditStorefrontDTO,
  ): Promise<IResponse<FormattedStorefront>> {
    const storefront = isUUID(id)
      ? await this.storefrontRepository.findbyIdAndUpdate(id, update)
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
      query.andWhere('storefront.slug IN (:...slugs)', { slugs });
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

    const results = storefronts.map((storefront) =>
      this.storefrontSanitizer.formatStoreFront(storefront),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { results, pagination },
    );
  }
}
