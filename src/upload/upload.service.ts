import { Injectable } from '@nestjs/common';
import { AwsS3Service } from '../@common/services/aws-s3.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../entities/file.entity';

@Injectable()
export class UploadService {
  constructor(
    private readonly s3Service: AwsS3Service,
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
  ) {}

  async uploadSingleFile(
    file: Express.MulterFile,
    folder: string = 'uploads'
  ): Promise<FileEntity> {
    const url = await this.s3Service.uploadFile(file, folder);

    const saved = this.fileRepo.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      folder,
    });

    return this.fileRepo.save(saved);
  }

  async uploadMultipleFiles(
    files: Express.MulterFile[],
    folder: string = 'uploads'
  ): Promise<FileEntity[]> {
    const urls = await this.s3Service.uploadFiles(files, folder);

    const savedFiles = files.map((file, i) =>
      this.fileRepo.create({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: urls[i],
        folder,
      })
    );

    return this.fileRepo.save(savedFiles);
  }
}

