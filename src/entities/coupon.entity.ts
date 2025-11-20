import { UUID } from 'crypto';
import {
  Entity,
  Check,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Product } from './product.entity';
import { Status } from '../@common/constants/status.constant';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';
import * as randomstring from 'randomstring';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

const CouponStatus = [
  Status.NOT_YET_VALID,
  Status.ACTIVE,
  Status.INACTIVE,
  Status.EXPIRED,
  Status.USAGE_LIMIT_REACHED,
] as const;

type CouponStatus = (typeof CouponStatus)[number];

@Entity('coupons')
@Check(`(product_id IS NULL) != (business_id IS NULL)`) //coupon must be tied to product or business
@Index('IDX_unique_code_not_deleted', (coupon: Coupon) => [coupon.code], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Coupon extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'code',
  })
  code: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({
    type: 'enum',
    enum: Object.values(DiscountType),
    name: 'discount_type',
  })
  discountType?: DiscountType;

  @Column({ type: 'int', name: 'discount_value' })
  discountValue?: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'min_order_amount',
  })
  minOrderAmount?: number;

  @Column({
    type: 'int',
    nullable: true,
    name: 'max_discount_amount',
  })
  maxDiscountAmount: number;

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'product_id' })
  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | UUID;

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'business_id' })
  @ManyToOne(() => Business, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'business_id' })
  business: Business | UUID;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'valid_from',
  })
  validFrom?: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'valid_to',
  })
  validTo?: Date;

  @Check(`"usage_limit" IS NULL OR "usage_limit" > 0`)
  @Column({ type: 'integer', nullable: true, name: 'usage_limit' })
  usageLimit?: number;

  @Column({ type: 'integer', nullable: true, name: 'usage_limit_per_user' })
  usageLimitPerUser?: number;

  @Column({ type: 'int', default: 0, name: 'used_count' })
  usedCount?: number;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: Status.ACTIVE,
  })
  status?: CouponStatus;

  @BeforeInsert()
  @BeforeUpdate()
  private updateStatus?() {
    const now = new Date();
    if (this.validFrom && now < this.validFrom) {
      this.status = Status.NOT_YET_VALID;
    } else if (this.validTo && now > this.validTo) {
      this.status = Status.EXPIRED;
    } else if (this.usageLimit && this.usedCount >= this.usageLimit) {
      this.status = Status.USAGE_LIMIT_REACHED;
    }
  }

  @BeforeInsert()
  private generateCode?() {
    if (!this.code) {
      //TODO: Modify logic to account for collisions
      this.code = randomstring.generate({
        length: 10,
        charset: 'alphanumeric',
        capitalization: 'uppercase',
      });
    }
  }
}
