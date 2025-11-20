import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SystemSettings } from '../../../src/entities/system-setting.entity';
import config from '../config/app.config';

const { db } = config();


// Convert env string 'true'/'false' to actual boolean
const synchronize = db.synchronize === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.name,
  entities: [SystemSettings],                 
  migrations: ['dist/migrations/*.js'],      
 synchronize: true,                 
  logging: true,                             
});
