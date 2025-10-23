import { HttpStatus, Injectable } from '@nestjs/common';
import { KycService } from '../kyc/services/kyc.service';
import { IResponse, ResponseService } from '../@common/response';
import { BusinessRepository } from '../repositories/business.repository';
import { AddBusinessesDTO, GetBusinessesQueryDTO } from './dtos/business.dto';
import { FindOptionsWhere } from 'typeorm';
import { Business } from '../entities/business.entity';
import { UUID } from 'crypto';
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
  ) {}

  async lookupCACDetails(regNumber: string) {
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
    userId: UUID,
  ): Promise<IResponse<Paginated<BusinessData>>> {
    const { forCurrUser, cacNumber, page, limit } = data;

    const filter: FindOptionsWhere<Business> = {};

    if (forCurrUser) filter.user = userId;
    if (cacNumber) filter.cacNumber = cacNumber;

    const { results: businesses, pagination } =
      await this.businessRepository.paginate({
        filter,
        pagination: { page, limit },
        options: { relations: ['stores'] },
      });

    const results = businesses.map((business) =>
      this.businessSanitizer.formatBusinessData(business),
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
    id: UUID,
    userId: UUID,
  ): Promise<IResponse<BusinessData | null>> {
    const business = isUUID(id)
      ? await this.businessRepository.findOne({
          where: { id, user: userId },
          relations: ['stores'],
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

  async addBusiness(payload: AddBusinessesDTO, userId: UUID) {
    const { name, description, logo, address, cacNumber } = payload;
    const response = await this.dbTransactionManager.transaction(
      async (manager) => {
        const entityManager = manager.entityManager;

        const businesses = await this.businessRepository
          .withManager(entityManager)
          .findByUser(userId, {
            lock: { mode: 'pessimistic_write' },
          });

        if (businesses.length >= MAX_NUM_BUSINESSES_PER_USER)
          return this.responseService.sendError(
            ErrorMessage.MAX_BUSINESS_LIMIT,
          );

        const activateBusiness = !!cacNumber;
        const business = await this.businessRepository
          .withManager(entityManager)
          .createStrict({
            user: userId,
            name,
            description,
            logo,
            cacNumber,
            ...(activateBusiness ? { status: Status.ACTIVE } : {}),
          });

        const businessId = business.id;

        const addressData = await this.addressRepository
          .withManager(entityManager)
          .createStrict({
            ...address,
            user: userId,
            business: businessId,
          });

        //TODO: get wallet limits for business wallet
        await this.walletRepository.withManager(entityManager).createStrict({
          type: WalletType.BUSINESS,
          user: userId,
          business: businessId,
        });

        await this.storeRepository.withManager(entityManager).createStrict({
          business: businessId,
          name,
        });

        const data = this.businessSanitizer.formatBusinessData({
          ...business,
          addresses: [addressData],
        });

        return this.responseService.sendSuccess(
          SuccessMessage.ADD_BUSINESS,
          data,
        );
      },
    );

    return response;
  }

  async activateBusiness(
    id: UUID,
    userId: UUID,
  ): Promise<IResponse<BusinessData | null>> {
    await this.businessRepository.update(
      { id, user: userId },
      { status: Status.ACTIVE },
    );

    const business = await this.businessRepository.findOne({
      where: { id, user: userId },
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
    businessId: UUID,
    userId: UUID,
    query: GetInvoicesDTO,
  ) {
    delete query.business;

    const business = isUUID(businessId)
      ? await this.businessRepository.exists({
          where: { user: userId, id: businessId },
        })
      : null;

    if (!business)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Business'),
        null,
        HttpStatus.NOT_FOUND,
      );

    return this.invoiceService.getInvoices({
      ...query,
      business: [businessId],
    });
  }
}
