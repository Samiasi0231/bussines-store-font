import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';
import { UUID } from 'crypto';
import { uuidv7 } from 'uuidv7';
import { IsNotEmpty } from 'class-validator';
import { EntityType } from '../@common/constants/entity.constant';

const ProductCollectionCreatorEntity = [
  EntityType.USER,
  EntityType.SYSTEM,
] as const;
type ProductCollectionCreatorEntity =
  (typeof ProductCollectionCreatorEntity)[number];

@Entity('product_collections')
export class ProductCollection extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: UUID = uuidv7() as UUID;

  @Index()
  @ManyToOne(() => Business, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  @IsNotEmpty()
  @Column({ name: 'business_id' })
  business: Business | UUID;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', name: 'visible', default: true })
  visible?: boolean;

  @Column({
    type: 'enum',
    enum: ProductCollectionCreatorEntity,
    name: 'created_by',
    default: EntityType.SYSTEM,
  })
  createdBy?: ProductCollectionCreatorEntity;
}
