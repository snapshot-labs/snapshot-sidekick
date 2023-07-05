import request from 'supertest';
import db from '../../src/helpers/mysql';
import { SqlFixtures as moderation } from '../fixtures/moderation';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('GET /api/moderation', () => {
  beforeAll(async () => {
    const data = Object.values(moderation)
      .flat()
      .map(d => Object.values(d));
    await db.queryAsync(`INSERT INTO moderation (action, type, value, created) VALUES ?`, [
      data as any
    ]);
  });

  afterAll(async () => {
    await db.queryAsync('DELETE FROM sidekick_test.moderation;');
    await db.endAsync();
  });

  describe('when list params is empty', () => {
    it('returns all the list', async () => {
      const response = await request(HOST).get('/api/moderation');

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchSnapshot();
    });
  });

  describe('when list params is set', () => {
    it.each(['flaggedLinks', 'verifiedSpaces', 'flaggedProposals', 'verifiedTokens'])(
      'returns only the selected %s list',
      async field => {
        const response = await request(HOST).get(`/api/moderation?list=${field}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSnapshot();
      }
    );
  });

  it('returns multiple list: verifiedSpaces,flaggedProposals', async () => {
    const response = await request(HOST).get(
      `/api/moderation?list=verifiedSpaces,flaggedProposals`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('ignores invalid field, and returns only verifiedSpaces', async () => {
    const response = await request(HOST).get(`/api/moderation?list=verifiedSpaces,testInvalid`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});
