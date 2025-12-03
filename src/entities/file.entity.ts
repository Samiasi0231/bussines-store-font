// entities/file.entity.ts
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

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ name: 'url' }) // For public: stores full URL, For presigned: stores S3 key
  url: string;

  @Column()
  folder: string;

  @Column({ name: 'user_id', nullable: true }) // Track who uploaded (for presigned)
  userId?: string;

  @Column({ name: 'last_accessed', type: 'timestamp', nullable: true })
  lastAccessed?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
