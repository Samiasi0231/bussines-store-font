import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { ProductService } from './product.service';
import { AddCategoryDTO, GetCategoriesQueryDTO } from './dtos/category.dto';
import {
  AddSubCategoryDTO,
  GetSubCategoriesQueryDTO,
} from './dtos/sub-category.dto';
import { AddProductDTO, GetProductsQueryDTO } from './dtos/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import { GetByIdParamDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';
import { RmqQueue } from '../@common/constants/queues.constant';

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts(@Query() query: GetProductsQueryDTO) {
    return this.productService.getProducts(query);
  }

  //TODO: This will be made a protected endpoint only accessible by a admin. This must be done before going live
  @Post('categories')
  @UseGuards(JwtAuthGuard)
  async addCategory(@Body() body: AddCategoryDTO) {
    return this.productService.addCategory(body);
  }

  //TODO: This will be made a protected endpoint only accessible by a admin. This must be done before going live
  @Post('sub-categories')
  @UseGuards(JwtAuthGuard)
  async addSubCategory(@Body() body: AddSubCategoryDTO) {
    return this.productService.addSubCategory(body);
  }

  @Get('categories')
  async getCategories(@Query() query: GetCategoriesQueryDTO) {
    return this.productService.getCategories(query);
  }

  @Get('sub-categories')
  async getSubCategoriesByCategory(@Query() query: GetSubCategoriesQueryDTO) {
    return this.productService.getSubCategories(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async addProduct(@Body() body: AddProductDTO, @User() user: UserProfile) {
    return this.productService.addProduct(body, user.id);
  }

  @Get(':id')
  async getProduct(@Param() param: GetByIdParamDTO) {
    return this.productService.getProduct(param.id as UUID);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteProduct(
    @Param() param: GetByIdParamDTO,
    @User() user: UserProfile,
  ) {
    return this.productService.deleteProduct(param.id as UUID, user.id as UUID);
  }

  @EventPattern(RmqQueue.PRODUCT_DELETED)
  async handleProductDeletion(data: { id: UUID }) {
    try {
      await this.productService.propagateProductDeletion(data.id);
    } catch (error) {
      this.logger.error(
        `Failed to propagate deletion for product ${data.id}`,
        error,
        error.stack,
      );
    }
  }
}
