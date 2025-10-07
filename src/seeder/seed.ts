import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';
import { SEEDERS } from './seeder.module';
import { Logger } from '@nestjs/common';

const Seeder = {
  async appRun() {
    const app = await NestFactory.createApplicationContext(AppModule);

    return {
      app,
      seeders: SEEDERS.map((seeder) => app.get(seeder)),
    };
  },

  async run() {
    const { app, seeders } = await Seeder.appRun();
    for (const seeder of seeders) {
      await seeder.seed();
    }

    await app.close();
  },
};

if (require.main === module)
  Seeder.run()
    .then(() => {
      Logger.log('Seeder ran successfully');
      process.exit(0);
    })
    .catch((error) => {
      Logger.error('Seeder failed to run', error);
      process.exit(1);
    });
