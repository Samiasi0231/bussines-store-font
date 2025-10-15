import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { Status } from '../@common/constants/status.constant';
import { Address } from './address.entity';
import { UUID } from 'crypto';
import { IsNotEmpty } from 'class-validator';
import { User } from './user.entity';
import { Store } from './store.entity';

@Entity('businesses')
export class Business extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Index()
  @ManyToOne(() => User, (user) => user, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  @Column({ name: 'user_id' })
  @IsNotEmpty()
  user: User | UUID;

  @Column({ name: 'cac_number', nullable: true })
  cacNumber?: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo?: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.PENDING,
  })
  status?: Status;

  @OneToMany(() => Address, (address) => address.kyc, { cascade: true })
  addresses?: Address[];

  @OneToMany(() => Store, (store) => store.business, { cascade: true })
  stores?: Store[];
}
