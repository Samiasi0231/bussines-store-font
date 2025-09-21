import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Status } from './status.entity';
import { BaseEntity } from './base.entity';
import { Util } from '../@common/utilities/helpers.utility';
import { UUID } from 'crypto';
import { uuidv7 } from 'uuidv7';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'other_name', type: 'varchar', length: 100, nullable: true })
  otherName?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email?: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 20,
    unique: true,
  })
  phoneNumber: string;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: 'phone_verified_at', type: 'timestamptz', nullable: true })
  phoneVerifiedAt?: Date;

  @Column({ name: 'last_logged_in_at', type: 'timestamptz', nullable: true })
  lastLoggedInAt?: Date;

  @Column({ name: 'date_of_birth', type: 'timestamptz', nullable: true })
  dateOfBirth?: Date;

  @ManyToOne(() => Status, { eager: true })
  @JoinColumn({ name: 'status' })
  status: Status;

  @Column({ select: false, type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', default: 'NG', length: 2 })
  iso2?: string;

  @BeforeInsert()
  private async beforeInsert() {
    this.password = await Util.hash(this.password);
  }
}
