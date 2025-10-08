import { Injectable, Logger } from '@nestjs/common';
import { ProductCategoryRepository } from '../../repositories/product-category.repository';

export const ProductCategories = [
  {
    name: 'Fashion and Lifestyle',
    subCategories: [
      'Men’s and Women’s Clothing',
      'Baby and Kids Essentials',
      'Footwear and Bags',
      'Jewelry and Accessories',
      'Traditional Wear',
    ],
  },
  {
    name: 'Phones and Accessories',
    subCategories: ['Smartphones', 'Chargers and Earphones', 'Phone Cases'],
  },
  {
    name: 'Food and Beverages',
    subCategories: [
      'Packaged Food',
      'Cooking Items (Oil, Rice, Spices)',
      'Drinks and Snacks',
    ],
  },
  {
    name: 'Health and Beauty',
    subCategories: ['Skincare', 'Haircare', 'Fragrances', 'Cosmetics'],
  },
  {
    name: 'Home and Kitchen Appliances',
    subCategories: [
      'Blenders',
      'Cookers and Microwaves',
      'Irons',
      'Fans and Power Banks',
    ],
  },
  {
    name: 'Groceries',
    subCategories: ['Household Essentials', 'Toiletries', 'Cleaning Supplies'],
  },
  {
    name: 'Electronics',
    subCategories: ['TVs and Audio Devices', 'Small Tech Gadgets'],
  },
  {
    name: 'Hair and Beauty Services',
    subCategories: [
      'Hair Styling',
      'Makeup Services',
      'Home Service Appointments',
    ],
  },
  {
    name: 'Event Services',
    subCategories: ['Event Planning', 'Rentals and Decorations', 'Photography'],
  },
  {
    name: 'Home Repairs and Cleaning',
    subCategories: ['Plumbing', 'Electrical Services', 'Cleaning Services'],
  },
  {
    name: 'Digital Marketing',
    subCategories: [
      'Social Media Management',
      'Branding Services',
      'Content Creation',
    ],
  },
  {
    name: 'Tutoring and Coaching',
    subCategories: ['Home Lessons', 'Fitness Training', 'Online Coaching'],
  },
  {
    name: 'Transport and Delivery',
    subCategories: ['Dispatch Rider Services', 'Moving Services'],
  },
] as const;

@Injectable()
export class ProductCategorySeeder {
  private readonly logger = new Logger(ProductCategorySeeder.name);

  constructor(private productCategoryRepository: ProductCategoryRepository) {}

  async seed() {
    for (const category of ProductCategories) {
      const name = category.name;
      const exists = await this.productCategoryRepository.categoryExists(name);

      if (!exists) {
        await this.productCategoryRepository.createStrict({
          name,
        });

        this.logger.log(`seeded category: ${name}`);
      }
    }
  }
}
