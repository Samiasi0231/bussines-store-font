import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, Body, BadRequestException, UseFilters } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadMiddleware } from '../@common/middleware/upload.middleware';
import { UploadService } from './upload.service';
import { FileEntity } from '../entities/file.entity';


@Controller('upload')

export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file', UploadMiddleware.memoryStorage()))
  async uploadSingle(
    @UploadedFile() file: Express.MulterFile,
    @Body('folder') folder?: string
  ): Promise<FileEntity> {
    console.log('Uploaded file:', file);
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.uploadService.uploadSingleFile(file, folder);
  }

  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 20, UploadMiddleware.memoryStorage()))
  async uploadMultiple(
    @UploadedFiles() files: Express.MulterFile[],
    @Body('folder') folder?: string
  ): Promise<FileEntity[]> {
    console.log('Uploaded files:', files); 
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required'); 
    }
    return this.uploadService.uploadMultipleFiles(files, folder);
  }
}
