import { memoryStorage } from 'multer';

export class UploadMiddleware {
  static memoryStorage() {
    return {
      storage: memoryStorage(),
      limits: {
        fileSize: parseInt(process.env.MAX_UPLOAD_FILE_SIZE || '52428800'), // 50MB default
      },
    };
  }
}
