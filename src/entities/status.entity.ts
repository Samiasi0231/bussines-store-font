import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Status as StatusType } from '../@common/constants/status.constant';
@Entity('statuses')
export class Status extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  declare id?: number;

  @Column({
    type: 'enum',
    enum: StatusType,
  })
  name: StatusType;

  @Column({ type: 'text' })
  description: string;
}
