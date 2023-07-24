import { readFileSync, rmSync, writeFileSync } from 'fs';
import { storageEngine } from '../../../src/helpers/utils';
import Cache from '../../../src/lib/cache';

const TEST_CACHE_DIR = 'cache-test';
const TEST_ID = 'test';
const TEST_STRING_CONTENT = 'test content';

describe('Cache', () => {
  const testStorageEngine = storageEngine(TEST_CACHE_DIR);
  const cache = new Cache(TEST_ID, testStorageEngine);

  afterAll(() => {
    rmSync(testStorageEngine.path(), { recursive: true });
  });

  describe('getCache()', () => {
    describe('when the cache exists', () => {
      const file = testStorageEngine.path(cache.filename);

      beforeEach(() => writeFileSync(file, TEST_STRING_CONTENT));
      afterEach(() => rmSync(file));

      it('returns the cached content', async () => {
        expect((await cache.getCache()).toString()).toEqual(TEST_STRING_CONTENT);
      });

      it('returns a Buffer', async () => {
        expect(await cache.getCache()).toBeInstanceOf(Buffer);
      });
    });

    describe('when the cache does not exists', () => {
      it('returns false', async () => {
        expect(await cache.getCache()).toBe(false);
      });
    });
  });

  describe('createCache()', () => {
    it('creates the cache file from a string', async () => {
      const spy = jest.spyOn(cache, 'getContent').mockResolvedValueOnce(TEST_STRING_CONTENT);
      await cache.createCache();

      expect((await cache.getCache()).toString()).toEqual(TEST_STRING_CONTENT);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('creates the cache file from a Buffer', async () => {
      const fixture = readFileSync(`${__dirname}/../../fixtures/icon.png`);
      const spy = jest.spyOn(cache, 'getContent').mockResolvedValueOnce(fixture);
      await cache.createCache();

      expect(await cache.getCache()).toEqual(fixture);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
