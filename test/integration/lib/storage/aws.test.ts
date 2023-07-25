import Aws from '../../../../src/lib/storage/aws';

const TEST_CONTENT = 'test content';
const TEST_FILENAME = 'test.cache';

describe('Storage/Aws', () => {
  const storage = new Aws('test-sidekiq');

  afterEach(() => {
    storage.delete(TEST_FILENAME);
  });

  describe('when the file does not exists', () => {
    it('can creates then retrieves the file', async () => {
      await storage.set(TEST_FILENAME, TEST_CONTENT);
      expect((await storage.get(TEST_FILENAME)).toString()).toEqual(TEST_CONTENT);
    });

    describe('get()', () => {
      it('returns false', async () => {
        expect(await storage.get('unknown-file')).toBe(false);
      });
    });
  });

  describe('when the file exists', () => {
    beforeEach(async () => {
      await storage.set(TEST_FILENAME, TEST_CONTENT);
    });

    describe('set()', () => {
      it('overwrites the file with new content', async () => {
        const newContent = 'new content';
        await storage.set(TEST_FILENAME, newContent);
        expect((await storage.get(TEST_FILENAME)).toString()).toEqual(newContent);
      });
    });

    describe('get()', () => {
      it('returns the file as Buffer', async () => {
        const result = await storage.get(TEST_FILENAME);
        expect(result.toString()).toEqual(TEST_CONTENT);
        expect(result).toBeInstanceOf(Buffer);
      });
    });
  });
});
