import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadMiddleware } from '../@common/middleware/upload.middleware';
import { UploadService } from './upload.service';
import { FileEntity } from '../entities/file.entity';
import { FileVisibility } from '../@common/services/aws-s3.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file', UploadMiddleware.memoryStorage()))
  async uploadSingle(
    @UploadedFile() file: Express.MulterFile,
    @Body('folder') folder?: string,
    @Body('visibility') visibility: FileVisibility = 'public',
  ): Promise<FileEntity> {
    if (!file) throw new BadRequestException('File is required');
    return this.uploadService.uploadSingleFile(file, folder, visibility);
  }

  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 20, UploadMiddleware.memoryStorage()))
  async uploadMultiple(
    @UploadedFiles() files: Express.MulterFile[],
    @Body('folder') folder?: string,
    @Body('visibility') visibility: FileVisibility = 'public',
  ): Promise<FileEntity[]> {
    if (!files || files.length === 0) throw new BadRequestException('Files are required');
    return this.uploadService.uploadMultipleFiles(files, folder, visibility);
  }
}
