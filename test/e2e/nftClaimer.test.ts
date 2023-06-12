import request from 'supertest';

const HOST = `http://localhost:${process.env.PORT || 3003}`;

describe('nftClaimer', () => {
  const maxSupply = 100;
  const mintPrice = 1000;
  const proposerFee = 5;
  const spaceTreasury = '0xc2E2B715d9e302947Ec7e312fd2384b5a1296099';

  describe('on space', () => {
    const salt = '0x618f48e4d12670f57ebb3372d41a4462f8c4f79e5a44dbb9da442a83a50fca45';
    const address = '0xc2E2B715d9e302947Ec7e312fd2384b5a1296099';
    const id = 'gitcoindao.eth';

    it('returns an error when the space does not exist', async () => {
      const response = await request(HOST).post('/api/nft-claimer/deploy').send({
        address,
        id: 'invalid-id',
        salt,
        maxSupply,
        mintPrice,
        proposerFee,
        spaceTreasury
      });

      expect(response.statusCode).toBe(404);
    });

    it('returns an error when the address is not the space owner', async () => {
      const response = await request(HOST).post('/api/nft-claimer/deploy').send({
        address,
        id: 'cakevote.eth',
        salt,
        maxSupply,
        mintPrice,
        proposerFee,
        spaceTreasury
      });

      expect(response.statusCode).toBe(500);
    });

    it.skip('returns an error when the space has not allowed minting', async () => {
      const response = await request(HOST)
        .post('/api/nft-claimer/deploy')
        .send({ address, id: 'cakevote.eth', salt });

      expect(response.statusCode).toBe(500);
    });

    it('returns a payload when the address is the space owner, and the space has allowed minting', async () => {
      const response = await request(HOST)
        .post('/api/nft-claimer/deploy')
        .send({ address, id, salt, maxSupply, mintPrice, proposerFee, spaceTreasury });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('initializer');
      expect(response.body.signature).toHaveProperty('r');
      expect(response.body.signature).toHaveProperty('s');
      expect(response.body.signature).toHaveProperty('v');
    });
  });

  describe('on proposal', () => {
    const address = '0xc2E2B715d9e302947Ec7e312fd2384b5a1296099';
    const id = '0x6b703b90d3cd1f82f7c176fc2e566a2bb79e8eb6618a568b52a4f29cb2f8d57b';
    const salt = '12345';

    it('returns an error when the proposal does not exist', async () => {
      const response = await request(HOST)
        .post('/api/nft-claimer/mint')
        .send({ address, id: 'invalid-id', salt });

      expect(response.statusCode).toBe(404);
    });

    it.skip('returns an error when the space has not allowed minting', async () => {
      const response = await request(HOST)
        .post('/api/nft-claimer/mint')
        .send({ address, id, salt });

      expect(response.statusCode).toBe(500);
    });

    it.skip('returns a payload if the space has allowed minting', async () => {
      const response = await request(HOST)
        .post('/api/nft-claimer/mint')
        .send({ address, id, salt });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('r');
      expect(response.body).toHaveProperty('s');
      expect(response.body).toHaveProperty('v');
    });
  });
});
