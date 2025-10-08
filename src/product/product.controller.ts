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
import { AddCategoryDTO, GetCategoriesQueryDTO } from './dtos/category.dto';
import {
  AddSubCategoryDTO,
  GetSubCategoriesQueryDTO,
} from './dtos/sub-category.dto';
import { AddProductDTO, GetProductsQueryDTO } from './dtos/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import { GetByIdParamsDTO } from '../@common/dtos/general.dto';
import { UUID } from 'crypto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts(@Query() query: GetProductsQueryDTO) {
    return this.productService.getProducts(query);
  }

  //TODO: This will be made a protected endpoint only accessible by a admin. This must be done before going live
  @Post('categories')
  async addCategory(@Body() body: AddCategoryDTO) {
    return this.productService.addCategory(body);
  }

  //TODO: This will be made a protected endpoint only accessible by a admin. This must be done before going live
  @Post('sub-categories')
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
  async getProduct(@Param() param: GetByIdParamsDTO) {
    return this.productService.getProduct(param.id as UUID);
  }
}
