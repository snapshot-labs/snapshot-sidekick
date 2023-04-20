import { S3 } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';

let client: S3;
const region = process.env.AWS_REGION;
const endpoint = process.env.AWS_ENDPOINT || undefined;
if (region) client = new S3({ region, endpoint });
const dir = 'sidekiq';

async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

export async function set(key: string, value: string) {
  try {
    return await client.putObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`,
      Body: value,
      ContentType: 'text/csv; charset=utf-8'
    });
  } catch (e) {
    console.log('Store cache failed', e);
    throw e;
  }
}

export async function get(key: string) {
  try {
    const { Body } = await client.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`
    });
    const str = await streamToString(Body as Readable);
    return str;
  } catch (e) {
    return false;
  }
}

export async function exist(key: string) {
  try {
    await client.headObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`
    });
    return true;
  } catch (e) {
    return false;
  }
}
