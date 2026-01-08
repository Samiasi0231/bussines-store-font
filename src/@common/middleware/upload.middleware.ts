import { memoryStorage } from 'multer';
import { BadRequestException, Logger } from '@nestjs/common';

export class UploadMiddleware {
  private static readonly logger = new Logger(UploadMiddleware.name);

  static memoryStorage() {
    const maxFileSize = parseInt(process.env.MAX_UPLOAD_FILE_SIZE || '52428800'); // 50MB default
    const maxFileSizeMB = maxFileSize / 1024 / 1024;

    this.logger.log(`Upload middleware configured - Max file size: ${maxFileSizeMB}MB (${maxFileSize} bytes)`);

    return {
      storage: memoryStorage(),
      limits: {
        fileSize: maxFileSize,
        files: 20, // Maximum number of files
        fields: 10, // Maximum number of non-file fields
        fieldNameSize: 100, // Maximum field name size
        fieldSize: 1024 * 1024, // 1MB max field value size
        headerPairs: 2000, // Maximum number of header key-value pairs
      },
      fileFilter: (req: any, file: Express.MulterFile, cb: Function) => {
        this.logger.debug(
          `File upload attempt - OriginalName: ${file.originalname}, MimeType: ${file.mimetype}, Size: ${file.size} bytes`,
        );

        if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('application/')) {
          this.logger.warn(`Unsupported file type rejected - MimeType: ${file.mimetype}, File: ${file.originalname}`);
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        cb(null, true);
      },
    };
  }
}
