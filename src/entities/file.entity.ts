import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  url: string;

  @Column({ default: 'uploads' })
  folder: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessed?: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
