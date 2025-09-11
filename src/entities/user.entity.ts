import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Status } from './status.entity';
import { v7 as uuidv7 } from 'uuid';
import { BaseEntity } from './base.entity';
import { UUID } from 'crypto';

@Entity('users')
export class User extends BaseEntity {
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: UUID;

  @BeforeInsert()
  private generateId() {
    this.id = uuidv7() as UUID;
  }

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'other_name', type: 'varchar', length: 100, nullable: true })
  otherName?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified?: boolean;
  emailVerified?: boolean;

  @Column({ name: 'last_logged_in_at', type: 'timestamptz', nullable: true })
  lastLoggedInAt?: Date;

  @ManyToOne(() => Status, { eager: true })
  @JoinColumn({ name: 'status' })
  status: Status;
}
