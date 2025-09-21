import { Injectable, Logger } from '@nestjs/common';
import { StatusRepository } from '../../repositories/status.repository';
import { Status } from '../../@common/constants/status.constant';

@Injectable()
export class StatusSeeder {
  private readonly logger = new Logger(StatusSeeder.name);

  constructor(private statusRepository: StatusRepository) {}

  async seed() {
    const statuses = Object.values(Status);

    for (const status of statuses) {
      const exists = await this.statusRepository.findOne({
        where: { name: status },
      });

      if (!exists) {
        await this.statusRepository.createStrict({
          name: status,
          description: `Indicates that the status of a record is ${status}`,
        });

        this.logger.log(`seeded ${status} status`);
      }
    }
  }
}
