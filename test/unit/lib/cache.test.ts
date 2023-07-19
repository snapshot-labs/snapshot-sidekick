import { rmSync, writeFileSync } from 'fs';
import { storageEngine } from '../../../src/helpers/utils';
import Cache from '../../../src/lib/cache';

const TEST_CACHE_DIR = 'cache-test';
const TEST_ID = 'test';
const TEST_CONTENT = 'test content';

describe('Cache', () => {
  const testStorageEngine = storageEngine(TEST_CACHE_DIR);
  const cache = new Cache(TEST_ID, testStorageEngine);

  afterAll(() => {
    rmSync(testStorageEngine.path(), { recursive: true });
  });

  describe('getCache()', () => {
    describe('when the cache exists', () => {
      const file = testStorageEngine.path(cache.filename);

      beforeEach(() => writeFileSync(file, TEST_CONTENT));
      afterEach(() => rmSync(file));

      it('returns the cache', async () => {
        expect(await cache.getCache()).toEqual(TEST_CONTENT);
      });
    });

    describe('when the cache does not exists', () => {
      it('returns false', async () => {
        expect(await cache.getCache()).toBe(false);
      });
    });
  });

  describe('createCache()', () => {
    jest.spyOn(cache, 'getContent').mockResolvedValueOnce(TEST_CONTENT);

    it('creates the cache file', async () => {
      await cache.createCache();

      expect(await cache.getCache()).toEqual(TEST_CONTENT);
    });
  });
});
