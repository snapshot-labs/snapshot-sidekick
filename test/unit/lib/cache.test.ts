import { readFileSync } from 'fs';
import { storageEngine } from '../../../src/helpers/utils';
import Cache from '../../../src/lib/cache';

const TEST_CACHE_DIR = 'cache-test';
const TEST_ID = 'test';
const TEST_STRING_CONTENT = 'test content';

describe('Cache', () => {
  const testStorageEngine = storageEngine(TEST_CACHE_DIR);
  const cache = new Cache(TEST_ID, testStorageEngine);

  describe('getCache()', () => {
    describe('when the cache exists', () => {
      it('returns the cached content as a Buffer', async () => {
        const mockCacheGet = jest
          .spyOn(testStorageEngine, 'get')
          .mockResolvedValueOnce(Buffer.from(TEST_STRING_CONTENT));
        const result = await cache.getCache();

        expect(result.toString()).toEqual(TEST_STRING_CONTENT);
        expect(result).toBeInstanceOf(Buffer);
        expect(mockCacheGet).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the cache does not exists', () => {
      it('returns false', async () => {
        const mockCacheGet = jest.spyOn(testStorageEngine, 'get').mockResolvedValueOnce(false);

        expect(await cache.getCache()).toBe(false);
        expect(mockCacheGet).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('createCache()', () => {
    const inputs = [
      ['string', TEST_STRING_CONTENT],
      ['buffer', readFileSync(`${__dirname}/../../fixtures/icon.png`)]
    ];

    it.each(inputs)('creates the cache file from a %s', async (type, content) => {
      const spy = jest.spyOn(cache, 'getContent').mockResolvedValueOnce(content);
      const mockCacheGet = jest.spyOn(testStorageEngine, 'set').mockResolvedValueOnce(true);

      await cache.createCache();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(mockCacheGet).toHaveBeenCalledWith(cache.filename, content);
    });
  });
});
