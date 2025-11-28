import { HttpStatus, Injectable } from '@nestjs/common';
import { KycService } from '../kyc/services/kyc.service';
import { IResponse, ResponseService } from '../@common/response';
import { BusinessRepository } from '../repositories/business.repository';
import { AddBusinessesDTO, GetBusinessesQueryDTO } from './dtos/business.dto';
import { FindOptionsWhere } from 'typeorm';
import { Business } from '../entities/business.entity';
import { Paginated } from '../@common/types/pagination.type';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import {
  BusinessData,
  BusinessSanitizer,
} from './sanitizers/business.sanitizer';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { MAX_NUM_BUSINESSES_PER_USER } from '../@common/constants/business.constant';
import { AddressRepository } from '../repositories/address.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { WalletType } from '../@common/constants/wallet.constant';
import { Status } from '../@common/constants/status.constant';
import { StoreRepository } from '../repositories/store.repository';
import { InvoiceService } from '../invoice/services/invoice.service';
import { GetInvoicesDTO } from '../invoice/dtos/invoice.dto';
import { isUUID } from 'class-validator';
import { CACLookupData } from '../kyc/dtos/cac.dto';
import { CacheService } from '../@common/cache/cache.service';
import { DEFAULT_PROVIDER_RESPONSE_CACHE_TTL } from '../@common/constants/cache.constant';
import { BusinessType } from '../@common/constants/business-type.contant';
import { User } from '../entities/user.entity';

@Injectable()
export class BusinessService {
  constructor(
    private readonly kycService: KycService,
    private readonly responseService: ResponseService,
    private readonly businessRepository: BusinessRepository,
    private readonly businessSanitizer: BusinessSanitizer,
    private readonly dbTransactionManager: DbTransactionManager,
    private readonly addressRepository: AddressRepository,
    private readonly walletRepository: WalletRepository,
    private readonly storeRepository: StoreRepository,
    private readonly invoiceService: InvoiceService,
    private readonly cacheService: CacheService,
  ) {}

  async lookupCACDetails(regNumber: string): Promise<IResponse<CACLookupData>> {
    const response =
      await this.kycService.identityProvider.lookupCAC(regNumber);

    if (!response.success)
      return this.responseService.sendError(
        response.message,
        null,
        response.status,
      );

    return response;
  }

  async getBusinesses(
    data: GetBusinessesQueryDTO,
    userId: string,
  ): Promise<IResponse<Paginated<BusinessData>>> {
    const uId = userId as `${string}-${string}-${string}-${string}-${string}`;
    const { forCurrUser, cacNumber, page, limit } = data;

    const filter: FindOptionsWhere<Business> = {};
    if (forCurrUser) filter.user = uId;
    if (cacNumber) filter.cacNumber = cacNumber;

    const { results: businesses, pagination } =
      await this.businessRepository.paginate({
        filter,
        pagination: { page, limit },
        options: { relations: ['stores', 'addresses'] },
      });

    const results = businesses.map((b) =>
      this.businessSanitizer.formatBusinessData(b),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.RETRIEVE_BUSINESSES,
      {
        results,
        pagination,
      },
    );
  }

  async getBusiness(
    businessId: string,
    userId: string,
  ): Promise<IResponse<BusinessData | null>> {
    const bId =
      businessId as `${string}-${string}-${string}-${string}-${string}`;
    const uId = userId as `${string}-${string}-${string}-${string}-${string}`;

    const business = isUUID(businessId)
      ? await this.businessRepository.findOne({
          where: { id: bId, user: uId },
          relations: ['stores', 'addresses'],
        })
      : null;

    if (!business)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Business'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const data = this.businessSanitizer.formatBusinessData(business);
    return this.responseService.sendSuccess(
      SuccessMessage.RETRIEVE_BUSINESS,
      data,
    );
  }

  async addBusiness(payload: AddBusinessesDTO, userId: string) {
    const uId = userId as `${string}-${string}-${string}-${string}-${string}`;
    const {
      description,
      logo,
      address,
      cacNumber,
      businessType,
      proposedName1,
      proposedName2,
      objectsOfMemorandum,
      witness,
      directors,
      shareholders,
      trustees,
      trusteesTenure,
      ngoPhone,
      ngoEmail,
    } = payload as any;

    let cacLookup: IResponse<CACLookupData> | null = null;
    if (cacNumber) {
      cacLookup = await this.cacheService.remember(
        `CAC:${cacNumber}`,
        DEFAULT_PROVIDER_RESPONSE_CACHE_TTL,
        () => this.lookupCACDetails(cacNumber),
      );
      if (!cacLookup.success) return cacLookup;
    }

    const previousBusinesses = await this.businessRepository.findByUser(uId);
    const firstPrev = previousBusinesses?.[0] ?? null;

    const response = await this.dbTransactionManager.transaction(
      async (manager) => {
        const entityManager = manager.entityManager;

        const user = await entityManager.getRepository(User).findOne({
          where: { id: uId },
        });
        const cacProfile = (user as any)?.cacProfile ?? null;

        const finalDirectors =
          directors ??
          cacProfile?.directors ??
          firstPrev?.extraData?.directors ??
          null;
        const finalShareholders =
          shareholders ??
          cacProfile?.shareholders ??
          firstPrev?.extraData?.shareholders ??
          null;
        const finalTrustees =
          trustees ??
          cacProfile?.trustees ??
          firstPrev?.extraData?.trustees ??
          null;
        const finalAddress =
          address ?? cacProfile?.address ?? firstPrev?.addresses?.[0] ?? null;

        if (businessType === BusinessType.NGO) {
          if (!finalTrustees?.trustees || finalTrustees.trustees.length < 2)
            return this.responseService.sendError(
              'NGO must have at least two trustees.',
            );
        }

        if (businessType === BusinessType.LIMITED_LIABILITY) {
          if (!finalDirectors?.length || !finalShareholders?.length)
            return this.responseService.sendError(
              'Limited liability company must have at least one director and shareholder.',
            );
        }

        if (cacNumber) {
          const existing = await this.businessRepository
            .withManager(entityManager)
            .findByCacNumber(cacNumber, {
              lock: { mode: 'pessimistic_write' },
            });
          if (existing)
            return this.responseService.sendError(
              ErrorMessage.CAC_NUMBER_TAKEN,
            );
        }

        const businesses = await this.businessRepository
          .withManager(entityManager)
          .findByUser(uId, { lock: { mode: 'pessimistic_write' } });

        if (businesses.length >= MAX_NUM_BUSINESSES_PER_USER)
          return this.responseService.sendError(
            ErrorMessage.MAX_BUSINESS_LIMIT,
          );

        const name =
          cacLookup?.data?.companyName ??
          proposedName1 ??
          proposedName2 ??
          (payload as any).name ??
          'Untitled Business';

        const activateBusiness = !!cacNumber;

        const business = await this.businessRepository
          .withManager(entityManager)
          .createStrict({
            user: uId,
            name,
            description,
            logo,
            cacNumber,
            proposedName1,
            proposedName2,
            businessType,
            extraData: {
              objectsOfMemorandum,
              witness,
              directors: finalDirectors,
              shareholders: finalShareholders,
              trustees: finalTrustees,
              trusteesTenure,
              ngoPhone,
              ngoEmail,
            },
            ...(activateBusiness ? { status: Status.ACTIVE } : {}),
          });

        const businessId =
          business.id as `${string}-${string}-${string}-${string}-${string}`;

        let addressData = null;
        if (finalAddress) {
          addressData = await this.addressRepository
            .withManager(entityManager)
            .createStrict({
              ...finalAddress,
              user: uId,
              business: businessId,
            });
        }

        await this.walletRepository.withManager(entityManager).createStrict({
          type: WalletType.BUSINESS,
          user: uId,
          business: businessId,
        });

        await this.storeRepository.withManager(entityManager).createStrict({
          business: businessId,
          name,
        });

        try {
          if (user) {
            const mergedProfile = {
              ...(user as any).cacProfile,
              directors: finalDirectors ?? (user as any).cacProfile?.directors,
              shareholders:
                finalShareholders ?? (user as any).cacProfile?.shareholders,
              trustees: finalTrustees ?? (user as any).cacProfile?.trustees,
              address: finalAddress ?? (user as any).cacProfile?.address,
            };
            await entityManager
              .getRepository(User)
              .update(uId, { cacProfile: mergedProfile });
          }
        } catch {}

        const data = this.businessSanitizer.formatBusinessData({
          ...business,
          addresses: addressData ? [addressData] : [],
        });

        return this.responseService.sendSuccess(
          SuccessMessage.ADD_BUSINESS,
          data,
        );
      },
    );

    return response;
  }

  async activateBusiness(businessId: string, userId: string) {
    const bId =
      businessId as `${string}-${string}-${string}-${string}-${string}`;
    const uId = userId as `${string}-${string}-${string}-${string}-${string}`;

    await this.businessRepository.update(
      { id: bId, user: uId },
      { status: Status.ACTIVE },
    );

    const business = await this.businessRepository.findOne({
      where: { id: bId, user: uId },
    });

    if (!business)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Business'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const data = this.businessSanitizer.formatBusinessData(business);
    return this.responseService.sendSuccess(
      SuccessMessage.ACTIVATE_BUSINESS,
      data,
    );
  }

  async getBusinessInvoices(
    businessId: string,
    userId: string,
    query: GetInvoicesDTO,
  ) {
    const bId =
      businessId as `${string}-${string}-${string}-${string}-${string}`;
    const uId = userId as `${string}-${string}-${string}-${string}-${string}`;
    delete query.business;

    const exists = isUUID(businessId)
      ? await this.businessRepository.exists({ where: { user: uId, id: bId } })
      : null;

    if (!exists)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Business'),
        null,
        HttpStatus.NOT_FOUND,
      );

    return this.invoiceService.getInvoices({ ...query, business: [bId] });
  }
}
