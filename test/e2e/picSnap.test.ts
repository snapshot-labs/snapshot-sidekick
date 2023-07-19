import request from 'supertest';
import { readFileSync, rmSync } from 'fs';
import { storageEngine } from '../../src/helpers/utils';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('picSnap', () => {
  afterAll(() => {
    const storage = storageEngine(process.env.PICSNAP_SUBDIR);
    rmSync(storage.path(), { recursive: true });
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

  describe('on OpenGraph space image', () => {
    // Regular space with description and avatar
    const space = 'test.wa0x6e.eth';

    describe('on existing space', () => {
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

    describe('on invalid space', () => {
      const invalidSpace = 'test-test-invalid.eth';

      describe('when fetching a SVG file', () => {
        it('returns a 404 error', async () => {
          const response = await request(HOST).get(`/api/picsnap/og-space/${invalidSpace}.svg`);

          expect(response.statusCode).toBe(404);
        });
      });

      describe('when fetching a PNG file', () => {
        it('returns a 404 error', async () => {
          const response = await request(HOST).get(`/api/picsnap/og-space/${invalidSpace}`);

          expect(response.statusCode).toBe(404);
        });
      });
    });
  });

  describe('on OpenGraph proposal image', () => {
    describe('on existing proposal', () => {
      it.todo('returns the svg file');
      it.todo('returns the png image');
    });

    describe('on invalid proposal', () => {
      const invalidProposal = '0x000';

      describe('when fetching a SVG file', () => {
        it('returns a 404 error', async () => {
          const response = await request(HOST).get(
            `/api/picsnap/og-proposal/${invalidProposal}.svg`
          );

          expect(response.statusCode).toBe(404);
        });
      });

      describe('when fetching a PNG file', () => {
        it('returns a 404 error', async () => {
          const response = await request(HOST).get(`/api/picsnap/og-proposal/${invalidProposal}`);

          expect(response.statusCode).toBe(404);
        });
      });
    });
  });
});
