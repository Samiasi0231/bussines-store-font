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
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

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
    console.log(this.region);
    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as const, // THIS MAKES IT PUBLIC
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      return this.getPublicUrl(key);
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadFiles(
    files: Express.MulterFile[],
    folder: string = 'uploads',
  ): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string): Promise<void> {
    const deleteParams = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  private generateFileKey(originalName: string, folder: string): string {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = extname(originalName);
    return `${folder}/${timestamp}-${randomString}${extension}`;
  }

  private getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
