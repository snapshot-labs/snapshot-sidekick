import { fetchWithKeepAlive } from '../../../src/helpers/utils';

describe('utils.ts', () => {
  describe('fetchWithKeepAlive', () => {
    const TEST_URL = 'https://sh5.co';

    it('set the custom agent with keep-alive', async () => {
      const response = await fetchWithKeepAlive(TEST_URL);
      expect(response.headers.get('connection')).toEqual('keep-alive');
    });
  });
});
