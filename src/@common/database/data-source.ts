import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SystemSettings } from '../../../src/entities/system-setting.entity';
import { FileEntity } from '../../../src/entities/file.entity';
import { CheckoutPayment } from '../../../src/entities/checkout-payment.entity';
import config from '../config/app.config';

const { db } = config();

// Convert env string 'true'/'false' to actual boolean
const synchronize = false;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.name,
  entities: [SystemSettings, FileEntity, CheckoutPayment],                 
  migrations: ['dist/migrations/*.js'],      
  synchronize: synchronize,                 
  logging: true,                             
});
