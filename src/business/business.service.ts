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

    const { results: beneficiaries, pagination } =
      await this.businessRepository.paginate({
        filter,
        pagination: { page, limit },
      });

    const results = beneficiaries.map((beneficiary) =>
      this.businessSanitizer.formatBusinessData(beneficiary),
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

        const business = await this.businessRepository
          .withManager(entityManager)
          .createStrict({ user: userId, name, description, logo, cacNumber });

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
}
