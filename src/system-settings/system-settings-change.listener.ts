import { Injectable, Logger } from '@nestjs/common';
import {
  RegisterPgTableChangeListener,
  PgTableChangeListener,
  PgTableChanges,
  PgTableChangeErrorHandler,
} from '@cisstech/nestjs-pg-pubsub';
import { SystemSettings } from '../entities/system-setting.entity';
import { SystemSettingsService } from './system-settings.service';

@Injectable()
@RegisterPgTableChangeListener(SystemSettings, {
  events: ['INSERT', 'UPDATE', 'DELETE'],
})
export class SystemSettingsTableChangeListener
  implements PgTableChangeListener<SystemSettings>
{
  private logger: Logger;
  constructor(private systemSettigsService: SystemSettingsService) {
    this.logger = new Logger(SystemSettingsTableChangeListener.name);
  }

  async process(
    changes: PgTableChanges<SystemSettings>,
    onError?: PgTableChangeErrorHandler,
  ): Promise<void> {
    try {
      changes.INSERT.forEach(() => {
        this.systemSettigsService.load();
        this.logger.log('System settings reloaded');
      });

      changes.UPDATE.forEach(() => {
        this.systemSettigsService.load();
        this.logger.log('System settings reloaded');
      });

      changes.DELETE.forEach(() => {
        this.systemSettigsService.load();
        this.logger.log('System settings reloaded');
      });
    } catch {
      if (onError) {
        onError(changes.all.map((change) => change.id));
      }
    }
  }
}
