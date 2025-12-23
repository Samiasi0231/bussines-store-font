import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { UUID } from 'crypto';

@Entity('business_types')
export class BusinessType extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive?: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'requirements'  })
  requirements?: {
    needsDirectors?: boolean;
    needsShareholders?: boolean;
    needsTrustees?: boolean;
    minTrustees?: number;
    needsWitness?: boolean;
  };
}