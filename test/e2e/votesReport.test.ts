import request from 'supertest';
import VotesReport from '../../src/lib/votesReport';
import { storageEngine } from '../../src/helpers/utils';
import { rmSync } from 'fs';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('GET /api/votes/:id', () => {
  const id = '0x1e5fdb5c87867a94c1c7f27025d62851ea47f6072f2296ca53a48fce1b87cdef';
  const storage = storageEngine(process.env.VOTE_REPORT_SUBDIR);

  afterEach(() => {
    rmSync(storage.path(), { recursive: true });
  });

  describe('when the cache exists', () => {
    const votesReport = new VotesReport(id, storage);

    beforeAll(async () => {
      try {
        await votesReport.createCache();
      } catch (e) {
        console.error('Error while creating the cache');
      }
    });

    it('returns the cached file', async () => {
      const response = await request(HOST).post(`/api/votes/${id}`);

      expect(response.statusCode).toBe(200);
      expect(response.text).toEqual((await votesReport.getCache()).toString());
    });
  });

  describe('when the cache does not exist', () => {
    describe('when the proposal exists', () => {
      it('returns a 202 status code, and creates the cache', async () => {
        const response = await request(HOST).post(`/api/votes/${id}`);

        expect(response.statusCode).toBe(202);

        const votesReport = new VotesReport(id, storage);
        expect(typeof (await votesReport.getCache())).not.toBe(false);
      });
    });

    describe('when proposal does not exist', () => {
      it('returns a 404 error', async () => {
        const response = await request(HOST).post('/api/votes/0x000');

        expect(response.statusCode).toBe(404);
      });
    });
  });
});
