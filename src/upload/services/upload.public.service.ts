import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../../entities/file.entity';
import { AwsS3PublicService } from '../utils/upload.public.aws-s3.service';

@Injectable()
export class UploadPublicService {
  constructor(
    private readonly s3Service: AwsS3PublicService,
    @InjectRepository(FileEntity) private readonly fileRepo: Repository<FileEntity>,
  ) {}

  async uploadSingleFile(file: Express.MulterFile, folder: string = 'uploads'): Promise<FileEntity> {
    const url = await this.s3Service.uploadFile(file, folder);
    const saved = this.fileRepo.create({ originalName: file.originalname, mimeType: file.mimetype, size: file.size, url, folder });
    return this.fileRepo.save(saved);
  }

  async uploadMultipleFiles(files: Express.MulterFile[], folder: string = 'uploads'): Promise<FileEntity[]> {
    const urls = await this.s3Service.uploadFiles(files, folder);
    const savedFiles = files.map((file, i) => this.fileRepo.create({ originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: urls[i], folder }));
    return this.fileRepo.save(savedFiles);
  }

  async deleteFile(fileId: string) {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new Error('File not found');
    const key = new URL(file.url).pathname.substring(1);
    await this.s3Service.deleteFile(key);
    await this.fileRepo.remove(file);
  }
}
