import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import { extname } from 'path';

@Injectable()
export class AwsS3PresignedService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'eu-west-1';
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

  /**
   * Upload single file privately (no public access)
   */
  async uploadFile(
    file: Express.MulterFile,
    folder: string = 'uploads',
    userId?: string,
  ): Promise<string> {
    const key = this.generateFileKey(file.originalname, folder, userId);

    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // NO ACL - file stays private
      Metadata: {
        'original-name': file.originalname,
        'uploaded-by': userId || 'system',
        'upload-date': new Date().toISOString(),
      },
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      return key; // Return ONLY the key, not a URL
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files privately
   */
  async uploadFiles(
    files: Express.MulterFile[],
    folder: string = 'uploads',
    userId?: string,
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folder, userId),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Generate pre-signed URL for existing file
   */
  async generatePresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });
      return signedUrl;
    } catch (error) {
      throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
  }

  /**
   * Generate pre-signed URLs for multiple files
   */
  async generatePresignedUrls(
    keys: string[],
    expiresIn: number = 3600,
  ): Promise<string[]> {
    const urlPromises = keys.map((key) =>
      this.generatePresignedUrl(key, expiresIn),
    );
    return Promise.all(urlPromises);
  }

  /**
   * Delete file from S3
   */
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

  /**
   * Generate unique file key
   */
  private generateFileKey(
    originalName: string,
    folder: string,
    userId?: string,
  ): string {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = extname(originalName);

    if (userId) {
      return `${folder}/${userId}/${timestamp}-${randomString}${extension}`;
    }

    return `${folder}/${timestamp}-${randomString}${extension}`;
  }
}
