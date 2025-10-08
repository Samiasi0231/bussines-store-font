import { Injectable, Logger } from '@nestjs/common';
import { SystemSettingsRepository } from '../../repositories/system-setting.repository';
import { SystemSettingKey } from '../../@common/constants/system-settings';

@Injectable()
export class DefaultProductCollectionSeeder {
  private readonly logger = new Logger(DefaultProductCollectionSeeder.name);

  constructor(private systemSettingRepository: SystemSettingsRepository) {}

  async seed() {
    const DEFAULT_COLLECTIONS = [
      { name: 'Bestsellers', description: 'Best selling products' },
      { name: 'New Arrivals', description: 'Recently added products' },
      { name: 'Trending', description: 'Popular products right now' },
    ];

    const configKey = SystemSettingKey.DEFAULT_PRODUCT_COLLECTIONS;

    const config = await this.systemSettingRepository.findOne({
      where: { key: configKey },
    });

    if (!config) {
      await this.systemSettingRepository.createStrict({
        key: configKey,
        value: DEFAULT_COLLECTIONS,
      });
      this.logger.log(`Seeded default product collections`);
    }
  }
}
