import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';
import { SEEDERS } from './seeder.module';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

const Seeder = {
  async appRun() {
    const app = await NestFactory.createApplicationContext(AppModule);

    // Wait for database connection and synchronization to complete
    const dataSource = app.get(DataSource);
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Give TypeORM a moment to complete synchronization if enabled
    await new Promise((resolve) => setTimeout(resolve, 1000));

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
      Logger.error('Seeder failed to run', error, error.stack);
      process.exit(1);
    });
