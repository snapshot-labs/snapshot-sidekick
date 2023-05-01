import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import log from '../../helpers/log';
import type { IStorage } from './types';

class Aws implements IStorage {
  client: S3Client;
  folder: string;

  constructor(folder: string) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('[storage:aws] AWS credentials missing');
    }

    this.client = new S3Client({});
    this.folder = folder;
  }

  set = async (key: string, value: string | Buffer) => {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `public/${this.folder}/${key}`,
        Body: value,
        ContentType: 'text/csv; charset=utf-8'
      });

      await this.client.send(command);
      log.error(`[storage:aws] File saved to public/${this.folder}/${key}`);

      return true;
    } catch (e) {
      log.error('[storage:aws] Store file failed', e);
      throw new Error('Unable to access storage');
    }
  };

  get = async (key: string) => {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `public/${this.folder}/${key}`
      });
      const response = await this.client.send(command);

      return response.Body ?? false;
    } catch (e) {
      log.error('[storage:aws] Create file failed', e);
      return false;
    }
  };
}

export default Aws;
