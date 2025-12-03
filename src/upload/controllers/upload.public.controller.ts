// controllers/upload-public.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadPublicService } from '../services';

@Controller('upload/public')
export class UploadPublicController {
  constructor(private readonly uploadService: UploadPublicService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.MulterFile,
    @Body('folder') folder?: string,
  ) {
    const result = await this.uploadService.uploadSingleFile(
      file,
      folder || 'uploads',
    );

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: result.id,
        url: result.url, // Direct public URL
        originalName: result.originalName,
        size: result.size,
      },
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.MulterFile[],
    @Body('folder') folder?: string,
  ) {
    const results = await this.uploadService.uploadMultipleFiles(
      files,
      folder || 'uploads',
    );

    return {
      success: true,
      message: `${results.length} files uploaded successfully`,
      data: results.map((r) => ({
        id: r.id,
        url: r.url,
        originalName: r.originalName,
        size: r.size,
      })),
    };
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    await this.uploadService.deleteFile(id);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }
}
