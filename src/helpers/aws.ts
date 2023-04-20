import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

let client: S3Client;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (region && accessKeyId && secretAccessKey) {
  client = new S3Client({
    region,
    credentials: {
      secretAccessKey,
      accessKeyId
    }
  });
}
const dir = 'sidekiq';

export async function set(key: string, value: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`,
      Body: value,
      ContentType: 'text/csv; charset=utf-8'
    });

    return await client.send(command);
  } catch (e) {
    console.log('Store cache failed', e);
    throw 'Unable to access storage';
  }
}

export async function get(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `public/${dir}/${key}`
    });
    const response = await client.send(command);

    return response.Body?.transformToString() || false;
  } catch (e) {
    return false;
  }
}
