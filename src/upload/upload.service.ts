import { Injectable } from '@nestjs/common';
import { AwsS3Service, FileVisibility } from '../@common/services/aws-s3.service';
import { FileEntity } from '../entities/file.entity';

@Injectable()
export class UploadService {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  async uploadSingleFile(
    file: Express.MulterFile,
    folder: string = 'uploads',
    visibility: FileVisibility = 'public',
  ): Promise<FileEntity> {
    const url = await this.awsS3Service.uploadFile(file, folder, visibility);
    const fileEntity = new FileEntity();
    fileEntity.originalName = file.originalname;
    fileEntity.mimeType = file.mimetype;
    fileEntity.size = file.size;
    fileEntity.url = url;
    fileEntity.folder = folder;
    fileEntity.visibility = visibility;
    return fileEntity;
  }

  async uploadMultipleFiles(
    files: Express.MulterFile[],
    folder: string = 'uploads',
    visibility: FileVisibility = 'public',
  ): Promise<FileEntity[]> {
    const urls = await this.awsS3Service.uploadFiles(files, folder, visibility);

    return files.map((file, index) => {
      const entity = new FileEntity();
      entity.originalName = file.originalname;
      entity.mimeType = file.mimetype;
      entity.size = file.size;
      entity.url = urls[index];
      entity.folder = folder;
      entity.visibility = visibility;
      return entity;
    });
  }
}
