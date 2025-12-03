import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { extname } from 'path';

export type FileVisibility = 'public' | 'private';

@Injectable()
export class AwsS3Service {
  private s3: AWS.S3;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    const awsConfig = this.config.get('aws');

    this.s3 = new AWS.S3({
      region: awsConfig.region,
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
    });

    this.bucket = awsConfig.bucketName;
  }

  private generateFileKey(originalName: string, folder: string) {
    return `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}${extname(
      originalName,
    )}`;
  }

  async uploadFile(
    file: Express.MulterFile,
    folder: string = 'uploads',
    visibility: FileVisibility = 'public',
  ): Promise<string> {
    const fileKey = this.generateFileKey(file.originalname, folder);

    try {
      await this.s3
        .upload({
          Bucket: this.bucket,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          // Remove ACL, bucket policy will control public/private
          CacheControl: 'max-age=31536000',
        })
        .promise();

      if (visibility === 'public') {
        return this.getPublicUrl(fileKey);
      } else {
        return await this.getSignedUrl(fileKey);
      }
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new InternalServerErrorException(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadFiles(
    files: Express.MulterFile[],
    folder: string,
    visibility: FileVisibility = 'public',
  ): Promise<string[]> {
    const uploads = files.map((file) => this.uploadFile(file, folder, visibility));
    return Promise.all(uploads);
  }

  // Public URL (if bucket allows public read access)
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.s3.config.region}.amazonaws.com/${key}`;
  }

  // Private URL (signed URL)
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn,
    });
  }
}
