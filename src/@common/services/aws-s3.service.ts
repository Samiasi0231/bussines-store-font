import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { extname } from 'path';

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

 async uploadFile(file: Express.MulterFile, folder: string): Promise<string> {
  try {
    const fileKey = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${extname(file.originalname)}`;

    const result = await this.s3
      .upload({
        Bucket: this.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    return result.Location;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to upload file to S3');
  }
}


  async uploadFiles(files: Express.MulterFile[], folder: string): Promise<string[]> {
    const uploads = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploads);
  }
}
