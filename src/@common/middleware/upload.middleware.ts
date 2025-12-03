import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export class UploadMiddleware {
  static memoryStorage() {
    return {
      storage: memoryStorage(),
      limits: {
        fileSize: parseInt(process.env.MAX_UPLOAD_FILE_SIZE || '52428800'), // 50MB default
      },
      fileFilter: (req: any, file: Express.MulterFile, cb: Function) => {
        if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('application/')) {
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        cb(null, true);
      },
    };
  }
}
