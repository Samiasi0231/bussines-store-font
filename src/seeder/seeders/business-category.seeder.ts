import { Injectable, Logger } from '@nestjs/common';
import { BusinessCategoryRepository } from '../../repositories/business-category.repository';

export const BusinessCategories = [
  {
    name: 'Fashion & Apparel',
    subCategories: [
      'Men\'s Clothing',
      'Women\'s Clothing',
      'Children\'s Clothing',
      'Footwear',
      'Bags & Accessories',
      'Jewelry',
      'Fabrics & Textiles',
      'Tailoring / Fashion Design Services',
      'Ready-to-Wear',
      'Traditional Attire',
    ],
  },
  {
    name: 'Beauty, Health & Personal Care',
    subCategories: [
      'Skincare Products',
      'Haircare Products',
      'Makeup & Cosmetics',
      'Fragrances',
      'Beauty Tools & Equipment',
      'Spa & Wellness Services',
      'Hair Salon Services',
      'Fitness & Supplements',
      'Medical Aesthetics',
    ],
  },
  {
    name: 'Food & Beverage',
    subCategories: [
      'Packaged Food Products',
      'Restaurants & Food Vendors',
      'Catering Services',
      'Snacks & Confectionery',
      'Beverages (Soft drinks, Juice, Tea, Coffee)',
      'Bakery & Pastries',
      'Frozen Foods',
      'Food Delivery Services',
      'Organic / Health Foods',
    ],
  },
  {
    name: 'Electronics & Gadgets',
    subCategories: [
      'Mobile Phones',
      'Computers & Laptops',
      'Accessories (Chargers, Earphones, Power Banks)',
      'Home Appliances',
      'Office Electronics',
      'Gaming Consoles & Accessories',
      'CCTV & Security Systems',
      'Repair & Maintenance Services',
    ],
  },
  {
    name: 'Home & Living',
    subCategories: [
      'Furniture',
      'Home Decor',
      'Kitchenware',
      'Bedding & Bath',
      'Lighting & Electricals',
      'Cleaning Supplies',
      'Home Improvement Tools',
      'Interior Decoration Services',
    ],
  },
  {
    name: 'Retail & General Merchandise',
    subCategories: [
      'Supermarket / Mini-Mart',
      'Convenience Store',
      'Wholesale Trading',
      'Import & Export',
      'Distribution & Supply Chain',
      'Street Retail',
    ],
  },
  {
    name: 'Digital Products & Services',
    subCategories: [
      'Software & SaaS',
      'Mobile Apps',
      'Website Design & Development',
      'UI/UX Design',
      'Digital Marketing Services',
      'Content Creation',
      'Online Courses',
      'E-books & Templates',
    ],
  },
  {
    name: 'Professional & Business Services',
    subCategories: [
      'Legal Services',
      'Accounting & Tax Services',
      'Consulting',
      'Business Registration Services',
      'HR & Recruitment',
      'Corporate Training',
      'Compliance & Advisory',
    ],
  },
  {
    name: 'Logistics & Transportation',
    subCategories: [
      'Dispatch & Courier Services',
      'Ride-hailing Services',
      'Freight & Haulage',
      'Moving Services',
      'Fleet Management',
      'Warehousing & Storage',
    ],
  },
  {
    name: 'Agriculture & Agro-Allied',
    subCategories: [
      'Crop Farming',
      'Livestock Farming',
      'Poultry',
      'Fishery',
      'Agro Processing',
      'Agro Export',
      'Farm Inputs & Equipment',
      'Agricultural Consultancy',
    ],
  },
  {
    name: 'Education & Training',
    subCategories: [
      'Schools & Colleges',
      'Coaching & Tutorials',
      'Online Education Platforms',
      'Skill Acquisition Centers',
      'Vocational Training',
      'Educational Materials & Supplies',
    ],
  },
  {
    name: 'Real Estate & Property',
    subCategories: [
      'Property Sales',
      'Property Rentals',
      'Real Estate Brokerage',
      'Facility Management',
      'Short-Let Apartments',
      'Construction Services',
    ],
  },
  {
    name: 'Hospitality & Tourism',
    subCategories: [
      'Hotels & Lodging',
      'Short-Stay Rentals',
      'Travel Agencies',
      'Tour Operators',
      'Event Planning',
      'Recreation & Entertainment',
    ],
  },
  {
    name: 'Media, Entertainment & Creative',
    subCategories: [
      'Photography',
      'Videography',
      'Music Production',
      'Film & Content Production',
      'Event MC & Talent Services',
      'Creative Agencies',
    ],
  },
  {
    name: 'Manufacturing & Production',
    subCategories: [
      'Small-Scale Manufacturing',
      'Food Processing',
      'Textile Production',
      'Plastic & Packaging',
      'Cosmetics Manufacturing',
      'Furniture Manufacturing',
    ],
  },
  {
    name: 'NGO & Social Enterprises',
    subCategories: [
      'Non-Profit Organizations',
      'Foundations',
      'Community Development',
      'Religious Organizations',
      'Advocacy Groups',
    ],
  },
  {
    name: 'Automotive & Mobility',
    subCategories: [
      'Auto Sales',
      'Auto Spare Parts',
      'Auto Repairs & Servicing',
      'Car Rentals',
      'Vehicle Accessories',
    ],
  },
  {
    name: 'Financial Services (Non-Bank)',
    subCategories: [
      'Fintech Services',
      'POS & Agency Banking',
      'Insurance Agents',
      'Micro-Lending',
      'Payment Solutions',
    ],
  },
  {
    name: 'Health & Medical Services',
    subCategories: [
      'Clinics & Hospitals',
      'Pharmacies',
      'Medical Laboratories',
      'Telemedicine Services',
      'Medical Equipment Sales',
    ],
  },
  {
    name: 'Telecommunications & IT Infrastructure',
    subCategories: [
      'Internet Service Providers',
      'Telecom Accessories',
      'Network Installation',
      'IT Support & Maintenance',
      'Cloud Services',
    ],
  },
] as const;

@Injectable()
export class BusinessCategorySeeder {
  private readonly logger = new Logger(BusinessCategorySeeder.name);

  constructor(
    private readonly businessCategoryRepository: BusinessCategoryRepository,
  ) {}

  async seed() {
    this.logger.log('Starting business category seeding...');

    for (const category of BusinessCategories) {
      const name = category.name;

      const parentExists = await this.businessCategoryRepository.findByName(
        name,
      );

      let parentCategory = parentExists;

      if (!parentExists) {
        parentCategory = await this.businessCategoryRepository.createStrict({
          name,
          isActive: true,
        });
        this.logger.log(`Seeded main category: ${name}`);
      } else {
        this.logger.log(`Main category already exists: ${name}`);
      }

      // Seed sub-categories
      for (const subCategoryName of category.subCategories) {
        const subExists = await this.businessCategoryRepository.findByName(
          subCategoryName,
          parentCategory.id,
        );

        if (!subExists) {
          await this.businessCategoryRepository.createStrict({
            name: subCategoryName,
            parentCategory: parentCategory.id,
            isActive: true,
          });
          this.logger.log(`  Seeded sub-category: ${subCategoryName}`);
        }
      }
    }
  }
}