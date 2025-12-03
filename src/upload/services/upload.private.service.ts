// services/upload-presigned.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Added In operator
import { FileEntity } from '../../entities/file.entity';
import { AwsS3PresignedService } from '../utils/upload.private.aws-s3.service';

@Injectable()
export class UploadPresignedService {
  constructor(
    private readonly s3Service: AwsS3PresignedService,
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
  ) {}

  /**
   * Upload single file privately (stores only S3 key, not URL)
   */
  async uploadSingleFile(
    file: Express.MulterFile,
    folder: string = 'uploads',
    userId?: string,
  ): Promise<FileEntity> {
    const s3Key = await this.s3Service.uploadFile(file, folder, userId);

    const saved = this.fileRepo.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: s3Key, // Store S3 key in 'url' field (or rename to 's3Key')
      folder,
      userId, // Optional: track who uploaded
    });

    return this.fileRepo.save(saved);
  }

  /**
   * Upload multiple files privately
   */
  async uploadMultipleFiles(
    files: Express.MulterFile[],
    folder: string = 'uploads',
    userId?: string,
  ): Promise<FileEntity[]> {
    const s3Keys = await this.s3Service.uploadFiles(files, folder, userId);

    const savedFiles = files.map((file, i) =>
      this.fileRepo.create({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: s3Keys[i], // Store S3 key
        folder,
        userId,
      }),
    );

    return this.fileRepo.save(savedFiles);
  }

  /**
   * Get pre-signed URL for a file (with optional access control)
   */
  async getFileUrl(
    fileId: string,
    expiresInMinutes: number = 60,
    requestUserId?: string,
  ): Promise<string> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Optional: Check if user has access to this file
    if (requestUserId && file.userId && file.userId !== requestUserId) {
      throw new UnauthorizedException('Access denied to this file');
    }

    const expiresIn = expiresInMinutes * 60;
    return this.s3Service.generatePresignedUrl(file.url, expiresIn);
  }

  /**
   * Get pre-signed URLs for multiple files
   */
  async getMultipleFileUrls(
    fileIds: string[],
    expiresInMinutes: number = 60,
    requestUserId?: string,
  ): Promise<Array<{ id: string; url: string; originalName: string }>> {
    const files = await this.fileRepo.find({
      where: { id: In(fileIds) },
    });

    if (files.length !== fileIds.length) {
      throw new NotFoundException('Some files not found');
    }

    // Optional: Filter files user has access to
    const accessibleFiles = requestUserId
      ? files.filter((f) => !f.userId || f.userId === requestUserId)
      : files;

    const expiresIn = expiresInMinutes * 60;
    const s3Keys = accessibleFiles.map((f) => f.url);
    const signedUrls = await this.s3Service.generatePresignedUrls(
      s3Keys,
      expiresIn,
    );

    return accessibleFiles.map((file, i) => ({
      id: file.id,
      url: signedUrls[i],
      originalName: file.originalName,
    }));
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, requestUserId?: string): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Optional: Check if user owns this file
    if (requestUserId && file.userId && file.userId !== requestUserId) {
      throw new UnauthorizedException('Access denied to delete this file');
    }

    await this.s3Service.deleteFile(file.url);
    await this.fileRepo.remove(file);
  }

  /**
   * Get file metadata without URL
   */
  async getFileMetadata(
    fileId: string,
    requestUserId?: string,
  ): Promise<FileEntity> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (requestUserId && file.userId && file.userId !== requestUserId) {
      throw new UnauthorizedException('Access denied to this file');
    }

    return file;
  }
}
