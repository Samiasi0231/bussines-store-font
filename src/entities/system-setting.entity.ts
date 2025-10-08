import { UUID } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';

@Entity('system_settings')
export class SystemSettings extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'varchar', unique: true })
  key: string;

  @Column({ type: 'jsonb' })
  value: Record<string, any>;
}
