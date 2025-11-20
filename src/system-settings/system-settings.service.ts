import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SystemSettingsRepository } from '../repositories/system-setting.repository';
import { SystemSettingKey } from '../@common/constants/system-settings';

export enum DefaultProviderConfig {
  IDENTITY = 'identity',
  EMAIL = 'email',
  IMAGE_RECOGNITION = 'image_recognition',
  CHECKOUT = 'checkout',
}

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  private logger: Logger;
  private settings: any = {};

  constructor(
    private readonly systemSettingRepository: SystemSettingsRepository,
  ) {
    this.logger = new Logger(SystemSettingsService.name);
  }

  async onModuleInit() {
    await this.load();
  }

  async load() {
    const savedSettigs = await this.systemSettingRepository.find({});

    savedSettigs.forEach((setting) => {
      this.settings[setting.key] = setting.value;
    });
  }

  get(key: SystemSettingKey) {
    return this.settings[key];
  }

  getDefaultProvider(key: DefaultProviderConfig) {
    return this.settings[SystemSettingKey.PROVIDERS]?.[key];
  }

  getDefaultProductCollections(): { name: string; description: string }[] {
    return this.settings[SystemSettingKey.DEFAULT_PRODUCT_COLLECTIONS];
  }
}
