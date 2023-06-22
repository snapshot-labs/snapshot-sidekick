import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { IStorage } from './types';

const CACHE_PATH = 'public';

class Aws implements IStorage {
  client: S3Client;
  subDir?: string;

  constructor(subDir?: string) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('[storage:aws] AWS credentials missing');
    }

    this.client = new S3Client({ endpoint: process.env.AWS_ENDPOINT });
    this.subDir = subDir;
  }

  async set(key: string, value: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: this.#path(key),
        Body: value,
        ContentType: 'text/csv; charset=utf-8'
      });

      await this.client.send(command);
      console.error(`[storage:aws] File saved to ${this.#path(key)}`);

      return true;
    } catch (e) {
      console.error('[storage:aws] File storage failed', e);
      throw new Error('Unable to access storage');
    }
  }

  async get(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: this.#path(key)
      });
      const response = await this.client.send(command);

      return response.Body?.transformToString() || false;
    } catch (e: any) {
      if (e['$metadata']?.httpStatusCode !== 404) {
        console.error('[storage:aws] File fetch failed', e);
      }

      return false;
    }
  }

  #path(key?: string) {
    return [CACHE_PATH, this.subDir?.replace(/^\/+|\/+$/, ''), key].filter(p => p).join('/');
  }
}

export default Aws;
