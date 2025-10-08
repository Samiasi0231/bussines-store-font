import { Injectable, Logger } from '@nestjs/common';
import { SystemSettingsRepository } from '../../repositories/system-setting.repository';
import { Provider } from '../../@common/constants/providers.constant';
import { SystemSettingKey } from '../../@common/constants/system-settings';
import { DefaultProviderConfig } from '../../system-settings/system-settings.service';

@Injectable()
export class DefaultProviderSeeder {
  private readonly logger = new Logger(DefaultProviderSeeder.name);

  constructor(private systemSettingRepository: SystemSettingsRepository) {}

  async seed() {
    const providers: Record<DefaultProviderConfig, Provider> = {
      [DefaultProviderConfig.IDENTITY]: Provider.DOJAH,
      [DefaultProviderConfig.EMAIL]: Provider.RESEND,
      [DefaultProviderConfig.IMAGE_RECOGNITION]: Provider.AWS,
    };

    const configKey = SystemSettingKey.PROVIDERS;

    const config = await this.systemSettingRepository.findOne({
      where: { key: configKey },
    });

    if (!config) {
      await this.systemSettingRepository.createStrict({
        key: configKey,
        value: providers,
      });
    } else {
      const updatedValue = { ...config.value };
      for (const providerKey of Object.keys(providers)) {
        if (!(providerKey in updatedValue)) {
          updatedValue[providerKey] = providers[providerKey];
        }
      }

      config.value = updatedValue;
      await this.systemSettingRepository.save(config);
    }

    this.logger.log(`Seeded default providers`);
  }
}
