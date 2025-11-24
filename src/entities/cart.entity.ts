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

@Entity('carts')
export class Cart extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User | UUID;

  @Column({
    type: 'timestamptz',
    name: 'expires_at',
    nullable: true,
  })
  expiresAt?: Date;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, { cascade: true })
  items: CartItem[];
}

