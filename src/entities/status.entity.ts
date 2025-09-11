import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum StatusType {
  ACTIVE = 'active',
  DELETED = 'deleted',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SUCCESSFUL = 'successful',
}

@Entity('statuses')
export class Status extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column({
    type: 'enum',
    enum: StatusType,
  })
  name: StatusType;

  @Column({ type: 'text' })
  description: string;
}
