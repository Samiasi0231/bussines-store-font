import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SystemSettingsRepository } from '../repositories/system-setting.repository';
import { SystemSettingKey } from '../@common/constants/system-settings';
import { withDbRetry, isTransientDbError } from '../@common/database/db-retry.utility';
import { QueryFailedError } from 'typeorm';

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
    try {
      // Use retry utility for transient errors, but handle missing table separately
      const savedSettigs = await withDbRetry(
        () => this.systemSettingRepository.find({}),
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          onRetry: (attempt, error) => {
            this.logger.warn(
              `Retrying system settings load (attempt ${attempt}): ${error?.message}`,
            );
          },
        },
      );

      savedSettigs.forEach((setting) => {
        this.settings[setting.key] = setting.value;
      });

      this.logger.log(`Loaded ${savedSettigs.length} system settings`);
    } catch (error: any) {
      // Handle missing table error (42P01 = relation does not exist)
      if (
        error?.code === '42P01' ||
        error?.driverError?.code === '42P01' ||
        (error?.message &&
          error.message.toLowerCase().includes('does not exist'))
      ) {
        this.logger.warn(
          'System settings table does not exist. This is normal if migrations have not been run yet. Continuing with empty settings.',
        );
        this.settings = {};
        return;
      }

      // Handle other database errors
      if (isTransientDbError(error)) {
        this.logger.error(
          'Failed to load system settings after retries. Continuing with empty settings.',
          error?.message || error,
        );
        this.settings = {};
        return;
      }

      // Re-throw unexpected errors
      this.logger.error(
        'Unexpected error loading system settings',
        error?.message || error,
      );
      throw error;
    }
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
