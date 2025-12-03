import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, Body, Delete, Param } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadPublicService } from '../services/upload.public.service';

@Controller('upload/public')
export class UploadPublicController {
  constructor(private readonly uploadService: UploadPublicService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.MulterFile, @Body('folder') folder?: string) {
    return this.uploadService.uploadSingleFile(file, folder || 'uploads');
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.MulterFile[], @Body('folder') folder?: string) {
    return this.uploadService.uploadMultipleFiles(files, folder || 'uploads');
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return this.uploadService.deleteFile(id);
  }
}
