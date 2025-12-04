import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { extname } from 'path';

@Injectable()
export class AwsS3PublicService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'eu-west-2';
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async uploadFile(
    file: Express.MulterFile,
    folder: string = 'uploads',
  ): Promise<string> {
    const key = this.generateFileKey(file.originalname, folder);

    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read' as const,
      CacheControl: 'max-age=31536000',
    };

    await this.s3Client.send(new PutObjectCommand(uploadParams));
    return this.getPublicUrl(key);
  }

  async uploadFiles(
    files: Express.MulterFile[],
    folder: string = 'uploads',
  ): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteFile(key: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
    );
  }

  private generateFileKey(originalName: string, folder: string): string {
    const timestamp = Date.now();
    const randomStr = randomBytes(8).toString('hex');
    const extension = extname(originalName);
    return `${folder}/${timestamp}-${randomStr}${extension}`;
  }

  private getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
