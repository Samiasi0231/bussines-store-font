import { Column, Entity, Generated, Index, PrimaryGeneratedColumn } from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';
import { BaseEntity } from './base.entity';
import { Status } from '../@common/constants/status.constant';

@Entity('partners')
export class Partner extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Index({ unique: true })
  @Column({ name: 'partner_no', type: 'int' })
  @Generated('increment')
  partnerNo?: number;

  @Index({ unique: true })
  @Column({ name: 'code', type: 'varchar', length: 20, nullable: true })
  code?: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

 
  @Column({ type: 'text', array: true, nullable: true })
  services?: string[];

  
  @Column({ type: 'numeric', precision: 3, scale: 1, default: 0 })
  rating?: number;

  
  @Index()
  @Column({ type: 'varchar', length: 50, default: Status.PENDING })
  status?: Status;
}

