import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3000}`;

describe('GET /api/moderationList', () => {
  describe('when fields params is empty', () => {
    it('returns all the list', async () => {
      const response = await request(HOST).get('/api/moderationList');

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchSnapshot();
    });
  });

  describe('when fields params is set', () => {
    it.each(['flaggedLinks', 'verifiedSpaces', 'flaggedProposals'])(
      'returns only the selected %s list',
      async field => {
        const response = await request(HOST).get(`/api/moderationList?fields=${field}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSnapshot();
      }
    );
  });

  it('returns multiple list: verifiedSpaces,flaggedProposals', async () => {
    const response = await request(HOST).get(
      `/api/moderationList?fields=verifiedSpaces,flaggedProposals`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('ignores invalid field, and returns only verifiedSpaces', async () => {
    const response = await request(HOST).get(
      `/api/moderationList?fields=verifiedSpaces,testInvalid`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});
