import { Express } from 'express';

declare global {
  namespace Express {
    export interface MulterFile {
      originalname: string;
      encoding: string;
      mimetype: string;
      buffer: Buffer;
      size: number;
      fieldname: string;
    }

    export interface Request {
      file?: MulterFile;
      files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
      reqId?: string;
    }
  }
}

export {};
