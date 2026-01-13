import { Controller, Get, Put, Param, Query, UseGuards, Body, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AdminOnly } from '../@common/decorators/admin-only.decorator';
import { Permissions } from '../@common/decorators/permissions.decorator';
import { AdminPermission } from '../@common/constants/permission.constant';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import {
  GetUsersQueryDTO,
  UpdateUserRolesDTO,
  GetBusinessesQueryDTO,
  GetRequestsQueryDTO,
  GetTransactionsQueryDTO,
  UpdateBusinessStatusDTO,
  AssignRequestDTO,
  UpdateRequestStatusDTO,
} from './dtos/admin.dto';
import { GetByIdParamDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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

  @Patch('businesses/:id/status')
  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.UPDATE_PARTNER)
  async updateBusinessStatus(
    @Param() param: GetByIdParamDTO,
    @Body() body: UpdateBusinessStatusDTO,
  ) {
    return this.adminService.updateBusinessStatus(param.id as UUID, body);
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
