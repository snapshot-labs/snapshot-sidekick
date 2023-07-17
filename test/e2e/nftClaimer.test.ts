import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('nftClaimer', () => {
  describe('GET /api/nft-claimer', () => {
    it('returns an object with the snapshotFee', async () => {
      const response = await request(HOST).get('/api/nft-claimer');
      const fee = response.body.snapshotFee;

      expect(response.statusCode).toBe(200);
      expect(fee).toBeLessThan(100);
      expect(fee).toBeGreaterThanOrEqual(1);
    });
  });
});
