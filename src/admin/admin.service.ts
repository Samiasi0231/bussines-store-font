import { Injectable, HttpStatus } from '@nestjs/common';
import { UserProfile } from '../user/interfaces/user.interface';
import { IResponse, ResponseService } from '../@common/response';
import {
  SuccessMessage,
  ErrorMessage,
} from '../@common/constants/message.constant';
import { UserRepository } from '../repositories/user.repository';
import { BusinessRepository } from '../repositories/business.repository';
import { OrderRepository } from '../repositories/order.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AdminRole } from '../@common/constants/role.constant';
import {
  GetUsersQueryDTO,
  UpdateUserRolesDTO,
  GetBusinessesQueryDTO,
  GetPartnersQueryDTO,
  GetRequestsQueryDTO,
  GetTransactionsQueryDTO,
  UpdateBusinessStatusDTO,
  AssignRequestDTO,
  UpdateRequestStatusDTO,
  OnboardPartnerDTO,
} from './dtos/admin.dto';
import { UUID } from 'crypto';
import { Paginated } from '../@common/types/pagination.type';
import { Status } from '../@common/constants/status.constant';
import { PartnerRepository } from '../repositories/partner.repository';
import { Partner } from '../entities/partner.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly userRepository: UserRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly orderRepository: OrderRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly partnerRepository: PartnerRepository,
  ) {}

  async getDashboard(user: UserProfile): Promise<IResponse<any>> {
    // Get comprehensive dashboard statistics
    const [
      totalUsers,
      totalBusinesses,
      totalActiveBusinesses,
      totalPendingBusinesses,
      totalPartners,
      totalActivePartners,
      totalPendingPartners,
      totalSuspendedPartners,
      totalPendingRequests,
      totalProcessingRequests,
      completedTodayCount,
      totalOrders,
      totalTransactions,
      completedPayoutsCount,
      pendingPayoutsCount,
    ] = await Promise.all([
      this.userRepository.count(),
      this.businessRepository.count(),
      this.businessRepository.count({ where: { status: Status.ACTIVE } }),
      this.businessRepository.count({ where: { status: Status.PENDING } }),
      this.partnerRepository.count(),
      this.partnerRepository.count({ where: { status: Status.ACTIVE } }),
      this.partnerRepository.count({ where: { status: Status.PENDING } }),
      this.partnerRepository.count({ where: { status: Status.BLOCKED } }),
      this.businessRepository.count({ where: { status: Status.PENDING } }),
      this.businessRepository.count({ where: { status: Status.PROCESSING } }),
      this.businessRepository
        .createQueryBuilder('business')
        .where('business.status = :status', { status: Status.COMPLETED })
        .andWhere('DATE(business.created_at) = CURRENT_DATE')
        .getCount(),
      this.orderRepository.count(),
      this.transactionRepository.count(),
      this.transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.status = :status', { status: Status.SUCCESSFUL })
        .getCount(),
      this.transactionRepository.count({ where: { status: Status.PENDING } }),
    ]);

    // Calculate SLA breaches (requests older than 3 days still pending/processing)
    const slaBreaches = await this.businessRepository
      .createQueryBuilder('business')
      .where('business.status IN (:...statuses)', {
        statuses: [Status.PENDING, Status.PROCESSING],
      })
      .andWhere("business.created_at < NOW() - INTERVAL '3 days'")
      .getCount();

    // Get recent requests (pending/processing businesses)
    const recentRequests = await this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.user', 'user')
      .leftJoinAndSelect('business.businessType', 'businessType')
      .where('business.status IN (:...statuses)', {
        statuses: [Status.PENDING, Status.PROCESSING],
      })
      .orderBy('business.createdAt', 'DESC')
      .take(5)
      .getMany();

    const formatRequestId = (id: string, date: Date) => {
      const year = new Date(date).getFullYear();
      const shortId = id.substring(0, 3).toUpperCase();
      return `REQ-${year}-${shortId.padStart(3, '0')}`;
    };

    const formattedRecentRequests = recentRequests.map((business) => ({
      id: business.id,
      requestId: formatRequestId(
        business.id as string,
        business.createdAt || new Date(),
      ),
      type:
        typeof business.businessType === 'object'
          ? business.businessType?.name
          : 'Business Registration',
      businessName: business.name,
      businessId: business.id,
      status: business.status,
      userId:
        typeof business.user === 'object' ? business.user?.id : business.user,
      userEmail:
        typeof business.user === 'object' ? business.user?.email : null,
      createdAt: business.createdAt,
    }));

    // Average partner score from partners table
    const avgPartnerScoreRow = await this.partnerRepository
      .createQueryBuilder('partner')
      .select('COALESCE(AVG(partner.rating), 0)', 'avg')
      .where('partner.deletedAt IS NULL')
      .getRawOne<{ avg: string }>();
    const avgPartnerScore = Number(avgPartnerScoreRow?.avg ?? 0);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        stats: {
          // User & Business Stats
          totalUsers,
          totalBusinesses,
          totalActiveBusinesses,
          totalPendingBusinesses,
          totalPartners,
          totalActivePartners,
          totalPendingPartners,
          totalSuspendedPartners,

          // Request Stats
          totalPendingRequests,
          totalProcessingRequests,
          completedToday: completedTodayCount,
          totalOrders,

          // Financial Stats
          partnerPayoutsComplete: completedPayoutsCount,
          pendingPayouts: pendingPayoutsCount,
          totalTransactions,

          // Performance Stats
          avgPartnerScore,
          slaBreachesThisWeek: slaBreaches,
        },
        recentRequests: formattedRecentRequests,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
    );
  }

  async getUsers(query: GetUsersQueryDTO): Promise<IResponse<Paginated<any>>> {
    const { page, limit, email, status, roles } = query;

    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.where('user.deletedAt IS NULL');

    if (email) {
      queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
        email: `%${email}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (roles && roles.length > 0) {
      queryBuilder.andWhere('user.roles && :roles', { roles });
    }

    const { results, pagination } = await this.userRepository.paginateWithQuery(
      {
        query: queryBuilder,
        pagination: { page, limit },
      },
    );

    const formattedResults = results.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: user.roles || [],
      createdAt: user.createdAt,
    }));

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results: formattedResults,
        pagination,
      },
    );
  }

  async updateUserRoles(
    userId: UUID,
    data: UpdateUserRolesDTO,
  ): Promise<IResponse<any>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return this.responseService.sendError(
        ErrorMessage.USER_NOT_FOUND,
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ roles: data.roles })
      .where('id = :id', { id: userId })
      .execute();

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        id: userId,
        roles: data.roles,
      },
    );
  }

  async getBusinesses(
    query: GetBusinessesQueryDTO,
  ): Promise<IResponse<Paginated<any>>> {
    const { page, limit, name, status, cacNumber } = query;

    const queryBuilder = this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.user', 'user')
      .leftJoinAndSelect('business.businessType', 'businessType')
      .leftJoinAndSelect('business.category', 'category')
      .where('business.deletedAt IS NULL');

    if (name) {
      queryBuilder.andWhere('LOWER(business.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }
    if (status) {
      queryBuilder.andWhere('business.status = :status', { status });
    }
    if (cacNumber) {
      queryBuilder.andWhere('business.cac_number = :cacNumber', { cacNumber });
    }

    const { results, pagination } =
      await this.businessRepository.paginateWithQuery({
        query: queryBuilder.orderBy('business.createdAt', 'DESC'),
        pagination: { page, limit },
      });

    // Business statistics
    const [total, active, pending, suspended] = await Promise.all([
      this.businessRepository.count(),
      this.businessRepository.count({ where: { status: Status.ACTIVE } }),
      this.businessRepository.count({ where: { status: Status.PENDING } }),
      this.businessRepository.count({ where: { status: Status.BLOCKED } }),
    ]);

    const formattedResults = results.map((business) => ({
      id: business.id,
      businessId: `BIZ-${business.id?.toString().substring(0, 8).toUpperCase()}`,
      name: business.name,
      cacNumber: business.cacNumber,
      status: business.status,
      userId:
        typeof business.user === 'object' ? business.user?.id : business.user,
      userEmail:
        typeof business.user === 'object' ? business.user?.email : null,
      businessType:
        typeof business.businessType === 'object'
          ? business.businessType?.name
          : null,
      category:
        typeof business.category === 'object' ? business.category?.name : null,
      logo: business.logo,
      createdAt: business.createdAt,
    }));

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results: formattedResults,
        pagination,
        stats: { total, active, pending, suspended },
      },
    );
  }

  async getPartners(
    query: GetPartnersQueryDTO,
  ): Promise<IResponse<Paginated<any>>> {
    const { page, limit, name, status, email } = query;

    const queryBuilder = this.partnerRepository
      .createQueryBuilder('partner')
      .where('partner.deletedAt IS NULL');

    if (name) {
      queryBuilder.andWhere('LOWER(partner.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }
    if (email) {
      queryBuilder.andWhere('LOWER(partner.email) LIKE LOWER(:email)', {
        email: `%${email}%`,
      });
    }
    if (status) {
      queryBuilder.andWhere('partner.status = :status', { status });
    }

    const { results, pagination } =
      await this.partnerRepository.paginateWithQuery({
        query: queryBuilder.orderBy('partner.createdAt', 'DESC'),
        pagination: { page, limit },
      });

    const [total, active, pending, suspended] = await Promise.all([
      this.partnerRepository.count(),
      this.partnerRepository.count({ where: { status: Status.ACTIVE } }),
      this.partnerRepository.count({ where: { status: Status.PENDING } }),
      this.partnerRepository.count({ where: { status: Status.BLOCKED } }),
    ]);

    const formatPartnerCode = (partnerNo?: number) => {
      if (!partnerNo || Number.isNaN(Number(partnerNo))) return null;
      return `PTR-${String(partnerNo).padStart(3, '0')}`;
    };

    const formattedResults = results.map((partner) => {
      const location = [partner.city, partner.country]
        .filter(Boolean)
        .join(', ');
      return {
        id: partner.id,
        partnerId: partner.code || formatPartnerCode(partner.partnerNo),
        name: partner.name,
        status: partner.status,
        email: partner.email,
        phone: partner.phone || null,
        location: location || null,
        services: partner.services || [],
        rating:
          typeof partner.rating === 'string'
            ? Number(partner.rating)
            : partner.rating,
        createdAt: partner.createdAt,
      };
    });

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results: formattedResults,
        pagination,
        stats: { total, active, pending, suspended },
      },
    );
  }

  async onboardPartner(data: OnboardPartnerDTO): Promise<IResponse<any>> {
    const existing = await this.partnerRepository.findByEmail(data.email);
    if (existing) {
      return this.responseService.sendError(
        ErrorMessage.ALREADY_EXISTS('Partner'),
        null,
        HttpStatus.CONFLICT,
      );
    }

    const partner = await this.partnerRepository.createStrict({
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      country: data.country,
      services: data.services,
      rating: (data.rating as any) ?? 0,
      status: data.status ?? Status.PENDING,
    } as unknown as Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>);

    const partnerNo = partner.partnerNo;
    const code =
      partner.code ||
      (partnerNo ? `PTR-${String(partnerNo).padStart(3, '0')}` : null);

    if (code && partner.code !== code) {
      await this.partnerRepository.update(partner.id as any, { code } as any);
      partner.code = code;
    }

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        id: partner.id,
        partnerId: partner.code,
        name: partner.name,
        email: partner.email,
        status: partner.status,
      },
    );
  }

  async updatePartnerStatus(
    partnerId: UUID,
    data: UpdateBusinessStatusDTO,
  ): Promise<IResponse<any>> {
    const partner = await this.partnerRepository.findById(partnerId);

    if (!partner) {
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Partner'),
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.partnerRepository
      .createQueryBuilder()
      .update()
      .set({ status: data.status })
      .where('id = :id', { id: partnerId })
      .execute();

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        id: partnerId,
        status: data.status,
      },
    );
  }

  async updateBusinessStatus(
    businessId: UUID,
    data: UpdateBusinessStatusDTO,
  ): Promise<IResponse<any>> {
    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Business'),
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.businessRepository
      .createQueryBuilder()
      .update()
      .set({ status: data.status })
      .where('id = :id', { id: businessId })
      .execute();

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        id: businessId,
        status: data.status,
      },
    );
  }

  async getRequests(
    query: GetRequestsQueryDTO,
  ): Promise<IResponse<Paginated<any>>> {
    const { page, limit, requestId, status, businessId, userId, assigneeId } =
      query;

    // Requests are business registration requests (businesses with status PENDING/PROCESSING)
    const queryBuilder = this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.user', 'user')
      .leftJoinAndSelect('business.businessType', 'businessType')
      .where('business.deletedAt IS NULL')
      .andWhere('business.status IN (:...requestStatuses)', {
        requestStatuses: [Status.PENDING, Status.PROCESSING],
      });

    if (requestId) {
      queryBuilder.andWhere('business.id::text LIKE :requestId', {
        requestId: `%${requestId}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('business.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('business.user_id = :userId', { userId });
    }

    if (businessId) {
      queryBuilder.andWhere('business.id = :businessId', { businessId });
    }

    // TODO: Add assignee filtering when assignee field is added to business entity

    const { results, pagination } =
      await this.businessRepository.paginateWithQuery({
        query: queryBuilder,
        pagination: { page, limit },
      });

    const formattedResults = results.map((business, index) => {
      const requestNumber = index + 1;
      const year = new Date().getFullYear();
      return {
        id: business.id,
        requestId: `REQ-${year}-${String(requestNumber).padStart(3, '0')}`,
        type:
          typeof business.businessType === 'object'
            ? business.businessType?.name
            : 'Business Registration',
        businessName: business.name,
        businessId: `BIZ-${business.id?.toString().substring(0, 8).toUpperCase()}`,
        status: business.status,
        priority: 'medium', // TODO: Add priority field to business entity
        assignee: null, // TODO: Add assignee field
        partner: null, // TODO: Add partner relationship
        sla: '7d', // TODO: Calculate SLA based on created date
        userId:
          typeof business.user === 'object' ? business.user?.id : business.user,
        userEmail:
          typeof business.user === 'object' ? business.user?.email : null,
        createdAt: business.createdAt,
      };
    });

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results: formattedResults,
        pagination,
      },
    );
  }

  async getTransactions(
    query: GetTransactionsQueryDTO,
  ): Promise<IResponse<Paginated<any>>> {
    const { page, limit, reference, status, userId, businessId } = query;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.wallet', 'wallet')
      .leftJoinAndSelect('wallet.user', 'user')
      .where('transaction.deletedAt IS NULL');

    if (reference) {
      queryBuilder.andWhere('transaction.reference LIKE :reference', {
        reference: `%${reference}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    const { results, pagination } =
      await this.transactionRepository.paginateWithQuery({
        query: queryBuilder,
        pagination: { page, limit },
      });

    const formattedResults = results.map((transaction: any) => ({
      id: transaction.id,
      reference: transaction.reference,
      amount: transaction.amount,
      status: transaction.status,
      type: transaction.type,
      userId: transaction.wallet?.user?.id || null,
      userEmail: transaction.wallet?.user?.email || null,
      createdAt: transaction.createdAt,
    }));

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results: formattedResults,
        pagination,
      },
    );
  }

  async updateRequestStatus(
    requestId: UUID,
    data: UpdateRequestStatusDTO,
  ): Promise<IResponse<any>> {
    const business = await this.businessRepository.findById(requestId);

    if (!business) {
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Request'),
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.businessRepository
      .createQueryBuilder()
      .update()
      .set({ status: data.status })
      .where('id = :id', { id: requestId })
      .execute();

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        id: requestId,
        status: data.status,
      },
    );
  }

  async assignRequest(
    requestId: UUID,
    data: AssignRequestDTO,
  ): Promise<IResponse<any>> {
    const business = await this.businessRepository.findById(requestId);

    if (!business) {
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Request'),
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    const assignee = await this.userRepository.findById(
      data.assigneeId as UUID,
    );

    if (!assignee) {
      return this.responseService.sendError(
        ErrorMessage.USER_NOT_FOUND,
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    // TODO: Add assignee field to business entity when implementing full request management
    // For now, we'll return success but not persist the assignment
    // await this.businessRepository
    //   .createQueryBuilder()
    //   .update()
    //   .set({ assigneeId: data.assigneeId })
    //   .where('id = :id', { id: requestId })
    //   .execute();

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        id: requestId,
        assigneeId: data.assigneeId,
        assignee: {
          id: assignee.id,
          email: assignee.email,
          firstName: assignee.firstName,
          lastName: assignee.lastName,
        },
        message:
          'Request assignment updated (assignee field needs to be added to business entity)',
      },
    );
  }
}
