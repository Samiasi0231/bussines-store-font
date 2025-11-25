import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AwsS3Service } from '../@common/services/aws-s3.service';
import { UploadMiddleware } from '../@common/middleware/upload.middleware';

@Controller('upload')
export class UploadController {
  constructor(private readonly s3Service: AwsS3Service) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file', UploadMiddleware.memoryStorage()))
  async uploadSingle(
    @UploadedFile() file: Express.MulterFile,
    @Body('folder') folder?: string,
  ) {
    const url = await this.s3Service.uploadFile(file, folder || 'uploads');
    return { url };
  }

  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 10, UploadMiddleware.memoryStorage()))
  async uploadMultiple(
    @UploadedFiles() files: Express.MulterFile[],
    @Body('folder') folder?: string,
  ) {
    const urls = await this.s3Service.uploadFiles(files, folder || 'uploads');
    return { urls };
  }
}
