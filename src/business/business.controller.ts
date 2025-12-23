import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CACLookupQueryDTO } from './dtos/cac.dto';
import { GetByIdParamDTO } from '../@common/dtos/general.dto';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import {
  AddBusinessesDTO,
  AddRegisteredBusinessDTO,
  GetBusinessesQueryDTO,
  RegisterNewBusinessDTO,
} from './dtos/business.dto';
import { UUID } from 'crypto';
import { GetInvoicesDTO } from '../invoice/dtos/invoice.dto';

@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  async getBusinesses(
    @User() user: UserProfile,
    @Query() query: GetBusinessesQueryDTO,
  ) {
    return this.businessService.getBusinesses(query, user.id);
  }

  @Get('cac/lookup')
  async lookupCACDetails(@Query() query: CACLookupQueryDTO) {
    return this.businessService.lookupCACDetails(
      query.regNumber,
      query.companyType,
      query.country
    );
  }

  @Post()
  async addBusiness(@User() user: UserProfile, @Body() body: AddBusinessesDTO) {
    try {
      return await this.businessService.addBusiness(body, user.id);
    } catch (error) {
      // Always return serializable JSON, avoids circular structure errors
      return {
        status: error.status || 500,
        message: error.message || 'Internal server error',
        data: {},
      };
    }
  }

  /**
   * FLOW 1: Register a new business with CAC registration
   * POST /businesses/register-new
   */
  @Post('register-new')
  async registerNewBusiness(
    @Body() payload: RegisterNewBusinessDTO,
    @User() user: UserProfile,
  ) {
    const userId = user.id;
    try {
      return await this.businessService.registerNewBusiness(payload, userId);
    } catch (error) {
      return {
        status: error.status || 500,
        message: error.message || 'Internal server error',
        data: {},
      };
    }
  }

  /**
   * FLOW 2: Add an already registered business
   * POST /businesses/add-registered
   */
  @Post('add-registered')
  async addRegisteredBusiness(
    @Body() payload: AddRegisteredBusinessDTO,
    @User() user: UserProfile,
  ) {
    const userId = user.id;
    try {
      return await this.businessService.addRegisteredBusiness(payload, userId);
    } catch (error) {
      return {
        status: error.status || 500,
        message: error.message || 'Internal server error',
        data: {},
      };
    }
  }

  @Post(':id/activation')
  async activateBusiness(
    @User() user: UserProfile,
    @Param() param: GetByIdParamDTO,
  ) {
    return this.businessService.activateBusiness(param.id as UUID, user.id);
  }

  @Get(':id/invoices')
  async getInvoices(
    @User() user: UserProfile,
    @Param() param: GetByIdParamDTO,
    @Query() query: GetInvoicesDTO,
  ) {
    return this.businessService.getBusinessInvoices(
      param.id as UUID,
      user.id as UUID,
      query,
    );
  }

  @Get(':id')
  async getBusiness(
    @User() user: UserProfile,
    @Param() param: GetByIdParamDTO,
  ) {
    return this.businessService.getBusiness(param.id as UUID, user.id);
  }
}
