import { Injectable } from '@nestjs/common';
import { Product } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';

type FormattedProductVariant = {
  id: string;
  price: number;
  options: Record<string, unknown>;
};

export type FormattedProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  quantity: number;
  variants: FormattedProductVariant[];
  options: { name: string; values: string[] }[];
};

export type FormattedProductForList = {
  id: string;
  name: string;
  price: number;
  description: string;
  quantity: number;
};
@Injectable()
export class ProductSanitizer {
  constructor() {}

  formatVariant(data: ProductVariant): FormattedProductVariant {
    const options: Record<string, string> = {};

    data.attributes?.forEach((attr) => {
      options[attr.name] = attr.value;
    });

    return { id: data.id, price: data.sellingPrice, options };
  }

  formatProduct(
    data: Product,
    options: { name: string; values: string[] }[],
  ): FormattedProduct {
    return {
      id: data.id,
      name: data.name,
      price: data.sellingPrice,
      description: data.description,
      quantity: data.quantity,
      variants: data.variants?.map((variant) => this.formatVariant(variant)),
      options,
    };
  }

  formatProductForList(data: Product): FormattedProductForList {
    return {
      id: data.id,
      name: data.name,
      price: data.sellingPrice,
      description: data.description,
      quantity: data.quantity,
    };
  }
}
