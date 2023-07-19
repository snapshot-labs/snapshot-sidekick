import request from 'supertest';
import { readFileSync, rmdirSync } from 'fs';
import { storageEngine } from '../../src/helpers/utils';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('picSnap', () => {
  afterAll(() => {
    const storage = storageEngine(process.env.PICSNAP_SUBDIR);
    rmdirSync(storage.path(), { recursive: true });
  });

  describe('on OpenGraph home image', () => {
    it('returns the svg file', async () => {
      const response = await request(HOST).get('/api/picsnap/og-home.svg');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual('image/svg+xml');
      expect(response.body.toString()).toEqual(
        readFileSync(`${__dirname}/../fixtures/picsnap/og-home.svg`, 'utf8').trim()
      );
    });

    it('returns the png image', async () => {
      const response = await request(HOST).get('/api/picsnap/og-home.png');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual('image/png');
      expect(response.body).toMatchImageSnapshot();
    });
  });

  describe('on OpenGraph regular space image', () => {
    // Regular space with description and avatar
    const space = 'aviator-dao.eth';

    it('returns the svg file', async () => {
      const response = await request(HOST).get(`/api/picsnap/og-space/${space}.svg`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual('image/svg+xml');
      expect(response.body.toString()).toEqual(
        readFileSync(`${__dirname}/../fixtures/picsnap/og-space-${space}.svg`, 'utf8').trim()
      );
    });

    it('returns the png image', async () => {
      const response = await request(HOST).get(`/api/picsnap/og-space/${space}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual('image/png');
      expect(response.body).toMatchImageSnapshot();
    });
  });

  describe('on OpenGraph space with non-latin character image', () => {
    it.todo('returns the svg file');
    it.todo('returns the png image');
  });

  describe('on OpenGraph space with emoji character image', () => {
    it.todo('returns the svg file');
    it.todo('returns the png image');
  });

  describe('on OpenGraph pending proposal image', () => {
    it.todo('returns the svg file');
    it.todo('returns the png image');
  });

  describe('on OpenGraph active proposal image', () => {
    it.todo('returns the svg file');
    it.todo('returns the png image');
  });

  describe('on OpenGraph closed proposal image', () => {
    it.todo('returns the svg file');
    it.todo('returns the png image');
  });
});
