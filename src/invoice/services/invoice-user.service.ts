import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseService } from '../../@common/response';
import { UUID } from 'crypto';
import { BusinessRepository } from '../../repositories/business.repository';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import { InvoiceUserRepository } from '../../repositories/invoice-user.repository';
import { FindOptionsWhere, ILike } from 'typeorm';
import {
  CreateInvoiceUserDTO,
  GetInvoiceUsersDTO,
} from '../dtos/invoice-user.dto';
import { InvoiceUserSanitizer } from '../sanitizers/invoice-user.sanitizer';
import { InvoiceUser } from '../../entities/invoice-user.entity';

@Injectable()
export class InvoiceUserService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly businessRepository: BusinessRepository,
    private readonly invoiceUserRepository: InvoiceUserRepository,
    private readonly invoiceUserSanitizer: InvoiceUserSanitizer,
  ) {}

  async createUser(payload: CreateInvoiceUserDTO, businessOwnerId: UUID) {
    const { phone, email, businessId, lastName, firstName } = payload;
    const business = await this.businessRepository.exists({
      where: { user: businessOwnerId, id: businessId },
    });

    if (!business)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Business'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const userExists = await this.invoiceUserRepository.exists({
      where: { phone },
    });

    if (userExists)
      return this.responseService.sendError(
        ErrorMessage.USER_WITH_PHONE_EXISTS,
        null,
        HttpStatus.CONFLICT,
      );

    const user = await this.invoiceUserRepository.createStrict({
      firstName,
      lastName,
      phone,
      email,
      business: businessId,
    });

    const data = this.invoiceUserSanitizer.formatUser(user);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
      HttpStatus.CREATED,
    );
  }

  async getUsers(data: GetInvoiceUsersDTO) {
    const { page, businessId, limit = 40, email, phone, name } = data;

    const filter:
      | FindOptionsWhere<InvoiceUser>
      | FindOptionsWhere<InvoiceUser>[] = [];

    const baseFilter: FindOptionsWhere<InvoiceUser> = {};

    if (businessId) baseFilter.business = businessId;
    if (email) baseFilter.email = ILike(`%${email}%`);
    if (phone) baseFilter.phone = ILike(`%${phone}%`);

    if (name) {
      filter.push(
        {
          ...baseFilter,
          firstName: ILike(`%${name}%`),
        },
        {
          ...baseFilter,
          lastName: ILike(`%${name}%`),
        },
      );
    } else {
      filter.push(baseFilter);
    }

    const { results: users, pagination } =
      await this.invoiceUserRepository.paginate({
        filter,
        pagination: { page, limit },
      });

    const results = users.map((user) =>
      this.invoiceUserSanitizer.formatUser(user),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { results, pagination },
    );
  }
}
