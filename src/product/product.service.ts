import { HttpStatus, Injectable } from '@nestjs/common';
import { AddCategoryDTO, GetCategoriesQueryDTO } from './dtos/category.dto';
import { ProductCategoryRepository } from '../repositories/product-category.repository';
import { IResponse, ResponseService } from '../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import {
  FormattedCategory,
  ProductCategorySanitizer,
} from './sanitizers/category.sanitizer';
import {
  FormattedSubCategory,
  ProductSubCategorySanitizer,
} from './sanitizers/sub-category.sanitizer';
import {
  FormattedProduct,
  FormattedProductCollection,
  FormattedProductForList,
  ProductSanitizer,
} from './sanitizers/product.sanitizer';
import { ProductSubCategoryRepository } from '../repositories/product-sub-category.repository';
import {
  AddSubCategoryDTO,
  GetSubCategoriesQueryDTO,
} from './dtos/sub-category.dto';
import { ProductCategory } from '../entities/product-category.entity';
import { Paginated } from '../@common/types/pagination.type';
import { FindOptionsWhere, SelectQueryBuilder } from 'typeorm';
import { ProductSubCategory } from '../entities/product-sub-category.entity';
import { AddProductDTO, GetProductsQueryDTO } from './dtos/product.dto';
import { StoreRepository } from '../repositories/store.repository';
import { UUID } from 'crypto';
import { ProductRepository } from '../repositories/product.repository';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { ProductImageRepository } from '../repositories/product-image.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductAttributeRepository } from '../repositories/product-attribute.repository';
import { Product } from '../entities/product.entity';
import { Util } from '../@common/utilities/helpers.utility';
import { QueryUtil } from '../@common/utilities/query.utility';
import { ProductCollectionProductRepository } from '../repositories/product-collection-product.repository';
import { ProductCollectionRepository } from '../repositories/product-collection.repository';
import {
  AddProductToCollectionDTO,
  CreateProductCollectionDTO,
  GetProductCollectionsQueryDTO,
  UpdateCollectionVisibilityDTO,
} from './dtos/product-collection.dto';
import { BusinessRepository } from '../repositories/business.repository';
import { EntityType } from '../@common/constants/entity.constant';
import { ProductCollection } from '../entities/product-collection.entity';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { ProductCollectionProduct } from '../entities/product-collection-product.entity';
import { Status } from '../@common/constants/status.constant';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { CouponRepository } from '../repositories/coupon.repository';
import { RmqQueue } from '../@common/constants/queues.constant';
import { RmqProducerService } from '../@common/rmq/rmq.producer.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productSubCategoryRepository: ProductSubCategoryRepository,
    private readonly productRepository: ProductRepository,
    private readonly responseService: ResponseService,
    private readonly productCategorySanitizer: ProductCategorySanitizer,
    private readonly productSubCategorySanitizer: ProductSubCategorySanitizer,
    private readonly productSanitizer: ProductSanitizer,
    private readonly storeRepository: StoreRepository,
    private readonly productImageRepository: ProductImageRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly productAttributeRepository: ProductAttributeRepository,
    private readonly productCollectionRepository: ProductCollectionRepository,
    private readonly productCollectionProductRepository: ProductCollectionProductRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly dbTransactionManager: DbTransactionManager,
    private readonly systemSettingsService: SystemSettingsService,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly couponRepository: CouponRepository,
    private readonly rmqProducerService: RmqProducerService,
  ) {}

  async addCategory(
    payload: AddCategoryDTO,
  ): Promise<IResponse<FormattedCategory>> {
    const { name, description } = payload;

    const categoryExists =
      await this.productCategoryRepository.categoryExists(name);

    if (categoryExists)
      return this.responseService.sendError(
        ErrorMessage.PRODUCT_CATEGORY_EXISTS,
      );

    const category = await this.productCategoryRepository.createStrict({
      name,
      description,
    });

    const data = this.productCategorySanitizer.formatCategory(category);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
      HttpStatus.CREATED,
    );
  }

  async addSubCategory(
    payload: AddSubCategoryDTO,
  ): Promise<IResponse<FormattedSubCategory>> {
    const { name, description, category: categoryId } = payload;

    const categoryExists = await this.productCategoryRepository.exists({
      where: { id: categoryId },
    });

    if (!categoryExists)
      return this.responseService.sendError(
        ErrorMessage.PRODUCT_CATEGORY_NOT_FOUND,
      );

    const subCategoryExists =
      await this.productSubCategoryRepository.subCategoryExists(
        name,
        categoryId,
      );

    if (subCategoryExists)
      return this.responseService.sendError(
        ErrorMessage.PRODUCT_SUB_CATEGORY_EXISTS,
      );

    const subCategory = await this.productSubCategoryRepository.createStrict({
      name,
      description,
      productCategory: categoryId,
    });

    const data =
      this.productSubCategorySanitizer.formatSubCategory(subCategory);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
      HttpStatus.CREATED,
    );
  }

  async getCategories(
    data: GetCategoriesQueryDTO,
  ): Promise<IResponse<Paginated<FormattedCategory>>> {
    const { page, limit } = data;
    const filter: FindOptionsWhere<ProductCategory> = {};

    const { results: categories, pagination } =
      await this.productCategoryRepository.paginate({
        filter,
        pagination: { page, limit },
      });

    const results = categories.map(
      this.productCategorySanitizer.formatCategory,
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results,
        pagination,
      },
    );
  }

  async getSubCategories(
    data: GetSubCategoriesQueryDTO,
  ): Promise<IResponse<Paginated<FormattedSubCategory>>> {
    const { page, limit, category: categoryId } = data;
    const filter: FindOptionsWhere<ProductSubCategory> = {};

    if (categoryId) filter.productCategory = categoryId;

    const { results: subCategories, pagination } =
      await this.productSubCategoryRepository.paginate({
        filter,
        pagination: { page, limit },
      });

    const results = subCategories.map(
      this.productSubCategorySanitizer.formatSubCategory,
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results,
        pagination,
      },
    );
  }

  async addProduct(
    payload: AddProductDTO,
    userId: UUID,
  ): Promise<IResponse<FormattedProduct>> {
    const {
      storeId,
      variants,
      images,
      name,
      trackInventory,
      orderLimit,
      description,
      subCategoryId,
      quantity,
    } = payload;

    let { sellingPrice, costPrice } = payload;
    [sellingPrice, costPrice] = [sellingPrice, costPrice].map((price) =>
      Util.toKobo(price),
    );

    const response = await this.dbTransactionManager.transaction<
      IResponse<FormattedProduct>
    >(async (manager) => {
      const entityManager = manager.entityManager;

      const store: {
        id: UUID;
        business: { id: UUID; status: Status };
      } = (await this.storeRepository
        .withManager(entityManager)
        .createQueryBuilder('store')
        .innerJoin('store.business', 'business')
        .innerJoin('business.user', 'user')
        .where('store.id = :storeId', { storeId })
        .andWhere('user.id = :userId', { userId })
        .select(['store.id', 'business.id', 'business.status'])
        .getOne()) as {
        id: UUID;
        business: { id: UUID; status: Status };
      };

      if (!store)
        return this.responseService.sendError(
          ErrorMessage.NOT_FOUND('Store'),
          null,
          HttpStatus.NOT_FOUND,
        );

      if (store.business.status !== Status.ACTIVE)
        return this.responseService.sendError(
          ErrorMessage.CANNOT_ADD_PROD_TO_INACTIVE_BUSINESS,
        );

      const subCategory = await this.productSubCategoryRepository
        .withManager(entityManager)
        .findById(subCategoryId);

      if (!subCategory)
        return this.responseService.sendError(
          ErrorMessage.NOT_FOUND('Sub-category'),
          null,
          HttpStatus.NOT_FOUND,
        );

      const productNameExists = await this.productRepository
        .withManager(entityManager)
        .productNameExists(name, storeId);

      if (productNameExists)
        return this.responseService.sendError(
          ErrorMessage.PRODUCT_NAME_EXISTS_FOR_STORE,
        );

      let product = await this.productRepository
        .withManager(entityManager)
        .createStrict({
          sellingPrice,
          costPrice,
          quantity,
          name,
          description,
          trackInventory,
          orderLimit,
          subCategory: subCategoryId,
          store: storeId,
        });

      for (const image of images) {
        await this.productImageRepository
          .withManager(entityManager)
          .createStrict({
            product: product.id,
            url: image.url,
            isPrimary: image.isPrimary,
          });
      }

      let totalQuantity = 0;
      const hasVariants = !!variants && variants.length > 0;

      if (hasVariants) {
        for (const variant of variants) {
          const { costPrice, sellingPrice, quantity, attributes } = variant;
          totalQuantity += quantity;

          const productVariant = await this.productVariantRepository
            .withManager(entityManager)
            .createStrict({
              product: product.id,
              quantity,
              sellingPrice: Util.toKobo(sellingPrice),
              costPrice: Util.toKobo(costPrice),
            });

          for (const attribute of Object.keys(attributes)) {
            await this.productAttributeRepository
              .withManager(entityManager)
              .createStrict({
                name: attribute,
                productVariant: productVariant.id,
                value: attributes[attribute],
              });
          }
        }

        product = await this.productRepository
          .withManager(entityManager)
          .findbyIdAndUpdate(
            product.id,
            {
              quantity: totalQuantity,
            },
            { relations: ['variants', 'variants.attributes'] },
          );
      }

      const defaultProductCollections =
        this.systemSettingsService.getDefaultProductCollections();

      for (const defaultCollection of defaultProductCollections) {
        const { name, description } = defaultCollection;
        const collection = await this.productCollectionRepository
          .withManager(entityManager)
          .createStrict({
            name,
            description,
            business: store.business.id,
          });

        await this.productCollectionProductRepository
          .withManager(entityManager)
          .createStrict({
            collection: collection.id,
            product: product.id,
          });
      }

      const productOptions = await this.productAttributeRepository
        .withManager(entityManager)
        .getProductOptions(product.id);

      const data = this.productSanitizer.formatProduct(product, productOptions);

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        data,
        HttpStatus.CREATED,
      );
    });

    return response;
  }

  async getProduct(id: UUID): Promise<IResponse<FormattedProduct>> {
    const product = await this.productRepository.findById(id, {
      relations: ['variants', 'variants.attributes'],
    });

    const productOptions =
      await this.productAttributeRepository.getProductOptions(product.id);

    const data = this.productSanitizer.formatProduct(product, productOptions);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  async getProducts(
    data: GetProductsQueryDTO,
  ): Promise<IResponse<Paginated<FormattedProductForList>>> {
    const {
      page,
      limit,
      category: categoryId,
      subCategory: subCategoryId,
      name,
      sort,
      price,
      createdAt,
      business: businessId,
      quantity,
      collection: collectionId,
    } = data;

    const filter: FindOptionsWhere<Product> = {};

    if (subCategoryId) filter.subCategory = subCategoryId;

    let query: SelectQueryBuilder<Product> = this.productRepository
      .createQueryBuilder('product')
      .where('product.deletedAt IS NULL');

    if (name) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    if (subCategoryId) {
      query.andWhere('product.sub_category_id = :subCategoryId', {
        subCategoryId,
      });
    }

    if (categoryId) {
      query
        .innerJoin('product.subCategory', 'subCategory')
        .innerJoin('subCategory.productCategory', 'category')
        .andWhere('category.id = :categoryId', { categoryId });
    }

    if (businessId) {
      query
        .innerJoin('product.store', 'store')
        .innerJoin('store.business', 'business')
        .andWhere('business.id = :businessId', {
          businessId,
        });
    }

    if (collectionId) {
      query
        .innerJoin('product.collectionProducts', 'pcp')
        .innerJoin('pcp.collection', 'collection')
        .where('collection.id = :collectionId', { collectionId });
    }

    if (createdAt) {
      const createdAtFilter = Util.parseDateFilter(createdAt);

      query = QueryUtil.applyRangeFilter(
        query,
        'product',
        'createdAt',
        createdAtFilter,
      );
    }

    if (price) {
      const priceFilter = Util.parseNumericRangeFilter(price, Util.toKobo);

      query = QueryUtil.applyNumericRangeFilter(
        query,
        'product',
        'sellingPrice',
        priceFilter,
      );
    }

    if (quantity) {
      const quantityFilter = Util.parseNumericRangeFilter(quantity);

      query = QueryUtil.applyNumericRangeFilter(
        query,
        'product',
        'quantity',
        quantityFilter,
      );
    }

    const sortFieldsMap = {
      createdAt: 'createdAt',
      price: 'sellingPrice',
      quantity: 'quantity',
    };

    const sortFilter = Util.parseSortParam(sort, sortFieldsMap);

    const { results: products, pagination } =
      await this.productRepository.paginateWithQuery({
        query,
        pagination: { page, limit },
        sort: sortFilter,
      });

    const results = products.map((product) =>
      this.productSanitizer.formatProductForList(product),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results,
        pagination,
      },
    );
  }

  async createProductCollection(
    payload: CreateProductCollectionDTO,
    userId: UUID,
  ): Promise<IResponse<FormattedProductCollection>> {
    const { name, description, businessId } = payload;

    const business = await this.businessRepository.exists({
      where: { id: businessId, user: userId },
    });

    if (!business)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Business'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const collectionExists =
      await this.productCollectionRepository.collectionExists(name, businessId);

    if (collectionExists)
      return this.responseService.sendError(
        ErrorMessage.PRODUCT_COLLECTION_EXISTS,
      );

    const collection = await this.productCollectionRepository.createStrict({
      name,
      description,
      business: businessId,
      createdBy: EntityType.USER,
    });

    const data = this.productSanitizer.formatProductCollection(collection);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
      HttpStatus.CREATED,
    );
  }

  async addProductToCollection(
    payload: AddProductToCollectionDTO & { collectionId: UUID },
  ): Promise<IResponse<null>> {
    const { productId, collectionId } = payload;

    const collection = await this.productCollectionRepository.exists({
      where: { id: collectionId },
    });

    if (!collection)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Product Collection'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const product = await this.productRepository.exists({
      where: { id: productId },
    });

    if (!product)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Product'),
        null,
        HttpStatus.NOT_FOUND,
      );

    await this.productCollectionProductRepository
      .createQueryBuilder()
      .insert()
      .into(ProductCollectionProduct)
      .values({
        collection: collectionId,
        product: productId,
      })
      .orIgnore()
      .execute();

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      null,
      HttpStatus.CREATED,
    );
  }

  async updateCollectionVisibility(
    payload: UpdateCollectionVisibilityDTO & { collectionId: UUID },
  ): Promise<IResponse<null>> {
    const { visible, collectionId } = payload;

    const collection = await this.productCollectionRepository.exists({
      where: { id: collectionId },
    });

    if (!collection)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Product Collection'),
        null,
        HttpStatus.NOT_FOUND,
      );

    await this.productCollectionRepository.update(
      { id: collectionId },
      { visible },
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
    );
  }

  async getCollections(
    payload: GetProductCollectionsQueryDTO,
  ): Promise<IResponse<Paginated<FormattedProductCollection>>> {
    const { page, limit, visible, business: businessId } = payload;
    const filter: FindOptionsWhere<ProductCollection> = {
      business: businessId,
    };

    if (visible !== undefined) filter.visible = visible;

    const { results: collections, pagination } =
      await this.productCollectionRepository.paginate({
        filter,
        pagination: { page, limit },
      });

    const results = collections.map(
      this.productSanitizer.formatProductCollection,
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      {
        results,
        pagination,
      },
    );
  }

  async deleteProduct(id: UUID, userId: UUID): Promise<IResponse<null>> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.store', 'store')
      .innerJoin('store.business', 'business')
      .where('product.id = :id', { id })
      .andWhere('product.deletedAt IS NULL')
      .andWhere('business.user_id = :userId', { userId })
      .getExists();

    if (!product)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Product'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const hasOrders = await this.orderItemRepository.exists({
      where: { product: id },
    });

    if (hasOrders)
      return this.responseService.sendError(
        ErrorMessage.PRODUCT_HAS_ORDERS,
        null,
        HttpStatus.BAD_REQUEST,
      );

    await this.productRepository.softDeleteById(id);

    this.rmqProducerService.sendToQueue(RmqQueue.PRODUCT_DELETED, {
      id,
    });

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
    );
  }

  async propagateProductDeletion(id: UUID): Promise<void> {
    await this.dbTransactionManager.transaction(async (manager) => {
      const entityManager = manager.entityManager;

      await this.couponRepository
        .withManager(entityManager)
        .softDelete({ product: id });

      await this.productCollectionProductRepository
        .withManager(entityManager)
        .softDelete({ product: id });

      await this.productImageRepository
        .withManager(entityManager)
        .softDelete({ product: id });

      await this.productVariantRepository
        .withManager(entityManager)
        .softDelete({ product: id });

      await this.productAttributeRepository
        .withManager(entityManager)
        .createQueryBuilder()
        .update()
        .set({ deletedAt: new Date() })
        .where(
          'product_variant_id IN (SELECT id FROM product_variants WHERE product_id = :productId AND deleted_at IS NULL)',
          { productId: id },
        )
        .andWhere('deleted_at IS NULL')
        .execute();
    });
  }
}
