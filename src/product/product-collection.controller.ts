import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import { GetByIdParamsDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';
import {
  AddProductToCollectionDTO,
  CreateProductCollectionDTO,
  GetProductCollectionsQueryDTO,
  UpdateCollectionVisibilityDTO,
} from './dtos/product-collection.dto';

@Controller('collections')
export class ProductCollectionController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProductCollection(
    @Body() body: CreateProductCollectionDTO,
    @User() user: UserProfile,
  ) {
    return this.productService.createProductCollection(body, user.id);
  }

  @Get()
  async getCollections(@Query() query: GetProductCollectionsQueryDTO) {
    return this.productService.getCollections(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/visibility')
  async updateCollectionVisibility(
    @Body() body: UpdateCollectionVisibilityDTO,
    @Param() param: GetByIdParamsDTO,
  ) {
    return this.productService.updateCollectionVisibility({
      ...body,
      collectionId: param.id as UUID,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/products')
  async addProductToCollection(
    @Body() body: AddProductToCollectionDTO,
    @Param() param: GetByIdParamsDTO,
  ) {
    return this.productService.addProductToCollection({
      ...body,
      collectionId: param.id as UUID,
    });
  }
}
