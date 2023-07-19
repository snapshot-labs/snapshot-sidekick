import request from 'supertest';
import { readFileSync, rmdirSync } from 'fs';
import { storageEngine } from '../../src/helpers/utils';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('picSnap', () => {
  afterAll(() => {
    const storage = storageEngine(process.env.PICSNAP_SUBDIR);
    rmdirSync(storage.path(), { recursive: true });
  });

  describe('GET /picsnap/og-home.svg', () => {
    it('returns the svg', async () => {
      const response = await request(HOST).get('/api/picsnap/og-home.svg');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual('image/svg+xml');
      expect(response.body.toString()).toEqual(
        readFileSync(`${__dirname}/../fixtures/picsnap/og-home.svg`, 'utf8').trim()
      );
    });
  });

  describe('GET /picsnap/og-home.png', () => {
    it('returns the png', async () => {
      const response = await request(HOST).get('/api/picsnap/og-home.png');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual('image/png');
      expect(response.body).toMatchImageSnapshot();
    });
  });
});
