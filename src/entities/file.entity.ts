import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string; // file.originalname

  @Column()
  mimeType: string; // file.mimetype

  @Column()
  size: number; // file.size

  @Column()
  url: string; // uploaded URL

  @Column()
  folder: string; // folder name

  @Column({ type: 'enum', enum: ['public', 'private'], default: 'public' })
  visibility: 'public' | 'private'; // public or private

  @Column({ nullable: true })
  userId?: string; // optional user association

  @CreateDateColumn()
  createdAt: Date;
}
