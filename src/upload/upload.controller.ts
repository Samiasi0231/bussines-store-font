import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, Body, BadRequestException, UseFilters, Logger } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadMiddleware } from '../@common/middleware/upload.middleware';
import { UploadService } from './upload.service';
import { FileEntity } from '../entities/file.entity';


@Controller('upload')

export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file', UploadMiddleware.memoryStorage()))
  async uploadSingle(
    @UploadedFile() file: Express.MulterFile,
    @Body('folder') folder?: string
  ): Promise<FileEntity> {
    this.logger.log(
      `File upload request received - OriginalName: ${file?.originalname}, Size: ${file?.size} bytes, MimeType: ${file?.mimetype}, Folder: ${folder || 'default'}`,
    );

    if (!file) {
      this.logger.warn('File upload failed - No file provided');
      throw new BadRequestException('File is required');
    }

    this.logger.log(`Processing file upload - FileId: ${file.originalname}, Size: ${file.size} bytes`);
    const result = await this.uploadService.uploadSingleFile(file, folder);
    this.logger.log(`File upload successful - FileId: ${result.id}, OriginalName: ${result.originalName}`);
    
    return result;
  }

  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 20, UploadMiddleware.memoryStorage()))
  async uploadMultiple(
    @UploadedFiles() files: Express.MulterFile[],
    @Body('folder') folder?: string
  ): Promise<FileEntity[]> {
    const totalSize = files?.reduce((sum, f) => sum + (f?.size || 0), 0) || 0;
    this.logger.log(
      `Multiple files upload request received - Count: ${files?.length || 0}, TotalSize: ${totalSize} bytes, Folder: ${folder || 'default'}`,
    );

    if (!files || files.length === 0) {
      this.logger.warn('Multiple files upload failed - No files provided');
      throw new BadRequestException('Files are required');
    }

    this.logger.log(`Processing ${files.length} file(s) upload`);
    const results = await this.uploadService.uploadMultipleFiles(files, folder);
    this.logger.log(`Multiple files upload successful - Uploaded ${results.length} file(s)`);
    
    return results;
  }
}
