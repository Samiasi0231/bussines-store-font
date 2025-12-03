import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import { extname } from 'path';

@Injectable()
export class AwsS3PresignedService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'eu-west-1';
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.MulterFile, folder: string = 'uploads', userId?: string): Promise<string> {
    const key = this.generateFileKey(file.originalname, folder, userId);

    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'original-name': file.originalname,
        'uploaded-by': userId || 'system',
        'upload-date': new Date().toISOString(),
      },
    };

    await this.s3Client.send(new PutObjectCommand(uploadParams));
    return key; // Return key only, not URL
  }

  async uploadFiles(files: Express.MulterFile[], folder: string = 'uploads', userId?: string): Promise<string[]> {
    return Promise.all(files.map(file => this.uploadFile(file, folder, userId)));
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return getSignedUrl(this.s3Client, new GetObjectCommand({ Bucket: this.bucketName, Key: key }), { expiresIn });
  }

  async generatePresignedUrls(keys: string[], expiresIn: number = 3600): Promise<string[]> {
    return Promise.all(keys.map(key => this.generatePresignedUrl(key, expiresIn)));
  }

  async deleteFile(key: string) {
    await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
  }

  private generateFileKey(originalName: string, folder: string, userId?: string): string {
    const timestamp = Date.now();
    const randomStr = randomBytes(8).toString('hex');
    const extension = extname(originalName);
    if (userId) return `${folder}/${userId}/${timestamp}-${randomStr}${extension}`;
    return `${folder}/${timestamp}-${randomStr}${extension}`;
  }
}
