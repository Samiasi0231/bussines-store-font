import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorefrontService } from './storefront.service';
import {
  CreateStorefrontDTO,
  GetStorefrontsDTO,
  EditStorefrontDTO,
} from './dtos/storefront.dto';
import { GetByIdParamDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';

@Controller()
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('storefronts')
  async getStorefronts(@Query() query: GetStorefrontsDTO) {
    return this.storefrontService.getStorefronts(query);
  }

  @Get('storefronts/:id')
  async getStorefront(@Param() param: GetByIdParamDTO) {
    return this.storefrontService.getStorefront(param.id as UUID);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stores/:id/storefronts')
  async createStorefront(
    @Param() param: GetByIdParamDTO,
    @Body() body: CreateStorefrontDTO,
  ) {
    return this.storefrontService.create(param.id as UUID, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('storefronts/:id')
  async updateStorefront(
    @Param() param: GetByIdParamDTO,
    @Body() body: EditStorefrontDTO,
  ) {
    return this.storefrontService.editStorefront(param.id as UUID, body);
  }
}
