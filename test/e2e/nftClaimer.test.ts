import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3000}`;

describe('nftClaimer', () => {
  const salt = '12345';

  describe('on space', () => {
    const address = '0xc2E2B715d9e302947Ec7e312fd2384b5a1296099';
    const id = 'gitcoindao.eth';

    it('returns an error when the space does not exist', async () => {
      const response = await request(HOST)
        .post('/api/nftClaimer/space/sign')
        .send({ address, id: 'invalid-id', salt });

      expect(response.statusCode).toBe(404);
    });

    it('returns an error when the address is not the space owner', async () => {
      const response = await request(HOST)
        .post('/api/nftClaimer/space/sign')
        .send({ address, id: 'cakevote.eth', salt });

      expect(response.statusCode).toBe(500);
    });

    it.skip('returns an error when the space has not allowed minting', async () => {
      const response = await request(HOST)
        .post('/api/nftClaimer/space/sign')
        .send({ address, id: 'cakevote.eth', salt });

      expect(response.statusCode).toBe(500);
    });

    it('returns a signature when the address is the space owner, and the space has allowed minting', async () => {
      const response = await request(HOST)
        .post('/api/nftClaimer/space/sign')
        .send({ address, id, salt: '12345' });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toHaveLength(132);
    });
  });

  describe('on proposal', () => {
    const address = '0xc2E2B715d9e302947Ec7e312fd2384b5a1296099';
    const id = '0x6b703b90d3cd1f82f7c176fc2e566a2bb79e8eb6618a568b52a4f29cb2f8d57b';

    it('returns an error when the proposal does not exist', async () => {
      const response = await request(HOST)
        .post('/api/nftClaimer/proposal/sign')
        .send({ address, id: 'invalid-id', salt });

      expect(response.statusCode).toBe(404);
    });

    it.skip('returns an error when the space has not allowed minting', async () => {
      const response = await request(HOST)
        .post('/api/nftClaimer/proposal/sign')
        .send({ address, id, salt });

      expect(response.statusCode).toBe(500);
    });

    it('returns a signature if the space has allowed minting', async () => {
      const response = await request(HOST)
        .post('/api/nftClaimer/proposal/sign')
        .send({ address, id, salt });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toHaveLength(132);
    });
  });
});
