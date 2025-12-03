// controllers/upload-presigned.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadPresignedService } from '../services';

@Controller('upload/private')
@UseGuards(AuthGuard('jwt')) // Protect all routes
export class UploadPresignedController {
  constructor(private readonly uploadService: UploadPresignedService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.MulterFile,
    @Body('folder') folder: string = 'uploads',
    @Request() req,
  ) {
    const userId = req.user.id; // From JWT

    const result = await this.uploadService.uploadSingleFile(
      file,
      folder,
      userId,
    );

    // Generate initial pre-signed URL (valid for 1 hour)
    const signedUrl = await this.uploadService.getFileUrl(
      result.id,
      60,
      userId,
    );

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: result.id,
        key: result.url, // S3 key
        url: signedUrl, // Temporary URL
        originalName: result.originalName,
        size: result.size,
        expiresIn: 3600,
      },
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.MulterFile[],
    @Body('folder') folder: string = 'uploads',
    @Request() req,
  ) {
    const userId = req.user.id;

    const results = await this.uploadService.uploadMultipleFiles(
      files,
      folder,
      userId,
    );

    // Generate initial pre-signed URLs
    const fileIds = results.map((r) => r.id);
    const urlData = await this.uploadService.getMultipleFileUrls(
      fileIds,
      60,
      userId,
    );

    return {
      success: true,
      message: `${results.length} files uploaded successfully`,
      data: urlData.map((item) => ({
        ...item,
        expiresIn: 3600,
      })),
    };
  }

  @Get(':id/url')
  async getFileUrl(
    @Param('id') id: string,
    @Query('expires') expiresInMinutes: number = 60,
    @Request() req,
  ) {
    const userId = req.user.id;

    const signedUrl = await this.uploadService.getFileUrl(
      id,
      expiresInMinutes,
      userId,
    );

    return {
      success: true,
      data: {
        url: signedUrl,
        expiresIn: expiresInMinutes * 60,
      },
    };
  }

  @Get(':id/metadata')
  async getFileMetadata(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;

    const file = await this.uploadService.getFileMetadata(id, userId);

    return {
      success: true,
      data: {
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        folder: file.folder,
        createdAt: file.createdAt,
      },
    };
  }

  @Post('batch/urls')
  async getBatchUrls(
    @Body('fileIds') fileIds: string[],
    @Body('expires') expiresInMinutes: number = 60,
    @Request() req,
  ) {
    const userId = req.user.id;

    const urlData = await this.uploadService.getMultipleFileUrls(
      fileIds,
      expiresInMinutes,
      userId,
    );

    return {
      success: true,
      data: urlData.map((item) => ({
        ...item,
        expiresIn: expiresInMinutes * 60,
      })),
    };
  }

  @Delete(':id')
  async deleteFile(@Param('id', ParseIntPipe) id: string, @Request() req) {
    const userId = req.user.id;

    await this.uploadService.deleteFile(id, userId);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }
}
