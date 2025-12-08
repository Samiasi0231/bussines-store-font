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
import {
  GetByIdParamDTO,
  GetBySlugParamDTO,
} from '../@common/dtos/general.dto';
import { UUID } from 'crypto';
import { validate } from 'class-validator';

@Controller()
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  // Public endpoints (no auth required)
  @Get('storefronts')
  async getStorefronts(@Query() query: GetStorefrontsDTO) {
    return this.storefrontService.getStorefronts(query);
  }

  @Get('storefronts/slug/:slug')
  async getStoreFrontBySlug(@Param() param: GetBySlugParamDTO) {
    return await this.storefrontService.getStorefrontBySlug(param.slug);
  }

  @Get('storefronts/:id')
  async getStorefront(@Param() param: GetByIdParamDTO) {
    return this.storefrontService.getStorefront(param.id as UUID);
  }

  // Protected endpoints (auth required)
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
    console.log('Received body:', JSON.stringify(body, null, 2));

    // Add validation pipe for better error messages
    const validationErrors = await this.validateDto(body);
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
    }

    return this.storefrontService.editStorefront(param.id as UUID, body);
  }

  private async validateDto(dto: any): Promise<string[]> {
    const errors = await validate(dto);
    return errors.map(
      (error) =>
        `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
    );
  }
}
