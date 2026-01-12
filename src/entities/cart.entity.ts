import { UUID } from 'crypto';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';
import { CartStatus } from './cart-status.constant';

@Entity('carts')
export class Cart extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | UUID;

  @Index()
  @Column({ type: 'varchar', name: 'session_id', nullable: true, length: 255 })
  sessionId?: string;

  @Column({
    type: 'timestamptz',
    name: 'expires_at',
    nullable: true,
  })
  expiresAt?: Date;

  @Index()
  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE,
    name: 'status',
  })
  status: CartStatus;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, { cascade: true })
  items: CartItem[];
}

