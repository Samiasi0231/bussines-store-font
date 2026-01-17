import { Controller, Get, Put, Param, Query, UseGuards, Body, Patch, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AdminOnly } from '../@common/decorators/admin-only.decorator';
import { Permissions } from '../@common/decorators/permissions.decorator';
import { AdminPermission } from '../@common/constants/permission.constant';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import { Public } from '../@common/decorators/public.decorator';
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
import { GetByIdParamDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { LoginDTO } from '../auth/dto/login.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('login')
  async adminLogin(@Body() body: LoginDTO) {
    return this.authService.adminLogin(body);
  }

  @Get('dashboard')
  @AdminOnly()
  @Permissions(AdminPermission.VIEW_DASHBOARD)
  async getDashboard(@User() user: UserProfile) {
    return this.adminService.getDashboard(user);
  }

  @Get('users')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.VIEW_USERS)
  async getUsers(@Query() query: GetUsersQueryDTO) {
    return this.adminService.getUsers(query);
  }

  @Put('users/:id/roles')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.MANAGE_ROLES)
  async updateUserRoles(
    @Param() param: GetByIdParamDTO,
    @Body() body: UpdateUserRolesDTO,
  ) {
    return this.adminService.updateUserRoles(param.id as UUID, body);
  }

  @Get('businesses')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.VIEW_PARTNERS)
  async getBusinesses(@Query() query: GetBusinessesQueryDTO) {
    return this.adminService.getBusinesses(query);
  }

  @Get('partners')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.VIEW_PARTNERS)
  async getPartners(@Query() query: GetPartnersQueryDTO) {
    return this.adminService.getPartners(query);
  }

  @Post('partners')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.CREATE_PARTNER)
  async onboardPartner(@Body() body: OnboardPartnerDTO) {
    return this.adminService.onboardPartner(body);
  }

  @Patch('businesses/:id/status')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.UPDATE_PARTNER)
  async updateBusinessStatus(
    @Param() param: GetByIdParamDTO,
    @Body() body: UpdateBusinessStatusDTO,
  ) {
    return this.adminService.updateBusinessStatus(param.id as UUID, body);
  }

  @Patch('partners/:id/status')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.UPDATE_PARTNER)
  async updatePartnerStatus(
    @Param() param: GetByIdParamDTO,
    @Body() body: UpdateBusinessStatusDTO,
  ) {
    return this.adminService.updatePartnerStatus(param.id as UUID, body);
  }

  @Get('requests')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.VIEW_REQUESTS)
  async getRequests(@Query() query: GetRequestsQueryDTO) {
    return this.adminService.getRequests(query);
  }

  @Get('transactions')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.VIEW_FINANCE)
  async getTransactions(@Query() query: GetTransactionsQueryDTO) {
    return this.adminService.getTransactions(query);
  }

  @Patch('requests/:id/status')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.UPDATE_REQUEST_STATUS)
  async updateRequestStatus(
    @Param() param: GetByIdParamDTO,
    @Body() body: UpdateRequestStatusDTO,
  ) {
    return this.adminService.updateRequestStatus(param.id as UUID, body);
  }

  @Put('requests/:id/assign')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.ASSIGN_REQUEST)
  async assignRequest(
    @Param() param: GetByIdParamDTO,
    @Body() body: AssignRequestDTO,
  ) {
    return this.adminService.assignRequest(param.id as UUID, body);
  }
}
