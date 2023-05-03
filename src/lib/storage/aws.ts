import type { Readable } from 'stream';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import log from '../../helpers/log';
import type { IStorage } from './types';

const streamToBuffer = (stream: Readable) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', reject);
  });

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
        Body: value
      });

      await this.client.send(command);
      log.info(`[storage:aws] File saved to public/${this.folder}/${key}`);

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
      log.info(`[storage:aws] File fetched from public/${this.folder}/${key}`);

      return streamToBuffer(response.Body as Readable);
    } catch (e) {
      log.error('[storage:aws] Fetch file failed', e);
      return false;
    }
  };
}

export default Aws;
