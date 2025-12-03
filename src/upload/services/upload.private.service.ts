import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FileEntity } from '../../entities/file.entity';
import { AwsS3PresignedService } from '../utils/upload.private.aws-s3.service';

@Injectable()
export class UploadPresignedService {
  constructor(
    private readonly s3Service: AwsS3PresignedService,
    @InjectRepository(FileEntity) private readonly fileRepo: Repository<FileEntity>,
  ) {}

  async uploadSingleFile(file: Express.MulterFile, folder: string = 'uploads', userId?: string): Promise<FileEntity> {
    const s3Key = await this.s3Service.uploadFile(file, folder, userId);
    const saved = this.fileRepo.create({ originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: s3Key, folder, userId });
    return this.fileRepo.save(saved);
  }

  async uploadMultipleFiles(files: Express.MulterFile[], folder: string = 'uploads', userId?: string): Promise<FileEntity[]> {
    const s3Keys = await this.s3Service.uploadFiles(files, folder, userId);
    const savedFiles = files.map((file, i) => this.fileRepo.create({ originalName: file.originalname, mimeType: file.mimetype, size: file.size, url: s3Keys[i], folder, userId }));
    return this.fileRepo.save(savedFiles);
  }

  async getFileUrl(fileId: string, expiresInMinutes = 60, requestUserId?: string): Promise<string> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    if (requestUserId && file.userId && file.userId !== requestUserId) throw new UnauthorizedException('Access denied');
    return this.s3Service.generatePresignedUrl(file.url, expiresInMinutes * 60);
  }

  async getMultipleFileUrls(fileIds: string[], expiresInMinutes = 60, requestUserId?: string): Promise<{ id: string, url: string, originalName: string }[]> {
    const files = await this.fileRepo.find({ where: { id: In(fileIds) } });
    if (files.length !== fileIds.length) throw new NotFoundException('Some files not found');
    const accessibleFiles = requestUserId ? files.filter(f => !f.userId || f.userId === requestUserId) : files;
    const urls = await this.s3Service.generatePresignedUrls(accessibleFiles.map(f => f.url), expiresInMinutes * 60);
    return accessibleFiles.map((file, i) => ({ id: file.id, url: urls[i], originalName: file.originalName }));
  }

  async deleteFile(fileId: string, requestUserId?: string) {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    if (requestUserId && file.userId && file.userId !== requestUserId) throw new UnauthorizedException('Access denied');
    await this.s3Service.deleteFile(file.url);
    await this.fileRepo.remove(file);
  }

  async getFileMetadata(fileId: string, requestUserId?: string): Promise<FileEntity> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    if (requestUserId && file.userId && file.userId !== requestUserId) throw new UnauthorizedException('Access denied');
    return file;
  }
}
