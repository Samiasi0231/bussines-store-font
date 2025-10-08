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
import { GetByIdParamsDTO } from '../@common/dtos/general.dto';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import { AddBusinessesDTO, GetBusinessesQueryDTO } from './dtos/business.dto';
import { UUID } from 'crypto';

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
    return this.businessService.lookupCACDetails(query.regNumber);
  }

  @Post()
  async addBusiness(@User() user: UserProfile, @Body() body: AddBusinessesDTO) {
    return this.businessService.addBusiness(body, user.id);
  }

  @Post(':id/activation')
  async activateBusiness(
    @User() user: UserProfile,
    @Param() param: GetByIdParamsDTO,
  ) {
    return this.businessService.activateBusiness(param.id as UUID, user.id);
  }

  @Get(':id')
  async getBusiness(
    @User() user: UserProfile,
    @Param() param: GetByIdParamsDTO,
  ) {
    return this.businessService.getBusiness(param.id as UUID, user.id);
  }
}
