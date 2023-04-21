import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { IStorage } from './types';

const DIR = 'sidekiq';

class Aws implements IStorage {
  client: S3Client;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw 'AWS credentials missing';
    }

    this.client = new S3Client({
      region,
      credentials: {
        secretAccessKey,
        accessKeyId
      }
    });
  }

  set = async (key: string, value: string) => {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `public/${DIR}/${key}`,
        Body: value,
        ContentType: 'text/csv; charset=utf-8'
      });

      return await this.client.send(command);
    } catch (e) {
      console.log('Store cache failed', e);
      throw 'Unable to access storage';
    }
  };

  get = async (key: string) => {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `public/${DIR}/${key}`
      });
      const response = await this.client.send(command);

      return response.Body?.transformToString() || false;
    } catch (e) {
      return false;
    }
  };
}

export default Aws;
