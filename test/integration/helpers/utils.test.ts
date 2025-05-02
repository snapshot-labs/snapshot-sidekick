import { fetchWithKeepAlive } from '../../../src/helpers/utils';
import fetch from 'node-fetch';

describe('utils.ts', () => {
  describe('fetchWithKeepAlive', () => {
    const TEST_URL = 'https://snapshot.org';

    it('set the custom agent with keep-alive', async () => {
      const response = await fetchWithKeepAlive(TEST_URL);
      expect(response.headers.get('connection')).toEqual('keep-alive');
    });

    it('does not use a keep-alive connection with default node-fetch', async () => {
      const response = await fetch(TEST_URL);
      expect(response.headers.get('connection')).toEqual('close');
    });
  });
});
