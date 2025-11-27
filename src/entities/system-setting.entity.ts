import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity({ name: 'system_settings' })
export class SystemSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  key: string;

  @Column({ type: 'jsonb', nullable: true })
  value: Record<string, any>;

  @CreateDateColumn({ nullable: true })
  created_at?: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at?: Date;
}




// import { UUID } from 'crypto';
// import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
// import { uuidv7 } from 'uuidv7';
// import { BaseEntity } from './base.entity';
// @Entity('system_settings')
// export class SystemSettings extends BaseEntity {
//   @PrimaryGeneratedColumn('uuid')
//   id = uuidv7() as UUID;

//   @Column({ type: 'varchar', unique: true })
//   key: string;

//   @Column({ type: 'jsonb' })
//   value: Record<string, any>;
// }
