import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3000}`;

describe('GET /moderationList', () => {
  describe('when fields params is empty', () => {
    it('returns all the list', async () => {
      const response = await request(HOST).get('/moderationList');

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchSnapshot();
    });
  });

  describe('when fields params is set', () => {
    it.each(['flaggedLinks', 'verifiedSpaces', 'flaggedProposalIds'])(
      'returns only the selected %s list',
      async field => {
        const response = await request(HOST).get(`/moderationList?fields=${field}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSnapshot();
      }
    );
  });

  it('returns multiple list: verifiedSpaces,flaggedProposalIds', async () => {
    const response = await request(HOST).get(
      `/moderationList?fields=verifiedSpaces,flaggedProposalIds`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('ignores invalid field, and returns only verifiedSpaces', async () => {
    const response = await request(HOST).get(`/moderationList?fields=verifiedSpaces,testInvalid`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});
