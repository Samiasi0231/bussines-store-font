import { Module } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettingsTableChangeListener } from './system-settings-change.listener';

@Module({
  providers: [SystemSettingsService, SystemSettingsTableChangeListener],
  exports: [SystemSettingsService, SystemSettingsTableChangeListener],
})
export class SystemSettingsModule {}
