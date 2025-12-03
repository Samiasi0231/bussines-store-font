import { Controller, Post, Get, Delete, UseInterceptors, UploadedFile, UploadedFiles, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadPresignedService } from '../services/upload.private.service';

@Controller('upload/private')
@UseGuards(AuthGuard('jwt'))
export class UploadPresignedController {
  constructor(private readonly uploadService: UploadPresignedService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.MulterFile, @Body('folder') folder: string = 'uploads', @Request() req) {
    const result = await this.uploadService.uploadSingleFile(file, folder, req.user.id);
    const signedUrl = await this.uploadService.getFileUrl(result.id, 60, req.user.id);
    return { ...result, url: signedUrl, expiresIn: 3600 };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.MulterFile[], @Body('folder') folder: string = 'uploads', @Request() req) {
    const results = await this.uploadService.uploadMultipleFiles(files, folder, req.user.id);
    const fileIds = results.map(r => r.id);
    const urls = await this.uploadService.getMultipleFileUrls(fileIds, 60, req.user.id);
    return urls.map(u => ({ ...u, expiresIn: 3600 }));
  }

  @Get(':id/url')
  async getFileUrl(@Param('id') id: string, @Query('expires') expires: number = 60, @Request() req) {
    const url = await this.uploadService.getFileUrl(id, expires, req.user.id);
    return { url, expiresIn: expires * 60 };
  }

  @Get(':id/metadata')
  async getFileMetadata(@Param('id') id: string, @Request() req) {
    return this.uploadService.getFileMetadata(id, req.user.id);
  }

  @Post('batch/urls')
  async getBatchUrls(@Body('fileIds') fileIds: string[], @Body('expires') expires: number = 60, @Request() req) {
    const urls = await this.uploadService.getMultipleFileUrls(fileIds, expires, req.user.id);
    return urls.map(u => ({ ...u, expiresIn: expires * 60 }));
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string, @Request() req) {
    return this.uploadService.deleteFile(id, req.user.id);
  }
}
