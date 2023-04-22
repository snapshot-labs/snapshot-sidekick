import { copyFileSync, existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import VotesReport from '../../../src/lib/votesReport';
import FileStorage from '../../../src/lib/storage/file';

describe('VotesReport', () => {
  const id = '0x1e5fdb5c87867a94c1c7f27025d62851ea47f6072f2296ca53a48fce1b87cdef';
  const weightedId = '0x79ae5f9eb3c710179cfbf706fa451459ddd18d4b0bce37c22aae601128efe927';
  let cacheFolder: string;
  let cachePath: string;
  let storageEngine: FileStorage;

  function cachedFilePath(id: string) {
    return `${cachePath}/snapshot-votes-report-${id}.csv`;
  }

  function fixtureFilePath(id: string) {
    return `${__dirname}/../../fixtures/snapshot-votes-report-${id}.csv`;
  }

  beforeEach(() => {
    cacheFolder = `votes-test-${Math.floor(Math.random() * 1e6)}`;
    cachePath = `${__dirname}/../../../tmp/${cacheFolder}`;
    storageEngine = new FileStorage(cacheFolder);

    if (!existsSync(cachePath)) {
      mkdirSync(cachePath);
    }
  });

  afterEach(() => {
    if (existsSync(cachePath)) {
      rmSync(cachePath, { recursive: true });
    }
  });

  it.each([
    ['single', id],
    ['weighted', weightedId]
  ])('caches a %s choices votes report', async (type: string, pid: string) => {
    const report = new VotesReport(pid, storageEngine);

    await report.generateCacheFile();

    return expect(readFileSync(cachedFilePath(pid))).toEqual(readFileSync(fixtureFilePath(pid)));
  });

  describe('canBeCached()', () => {
    it('raises an error when the proposal does not exist', () => {
      const report = new VotesReport('test', storageEngine);
      const votesReportSpy = jest.spyOn(report, 'fetchProposal').mockResolvedValueOnce(null);

      expect(report.canBeCached()).rejects.toBe('PROPOSAL_NOT_FOUND');
      expect(votesReportSpy).toHaveBeenCalled();
    });

    it('raises an error when the proposal is not closed', async () => {
      const report = new VotesReport(id, storageEngine);
      const votesReportSpy = jest
        .spyOn(report, 'fetchProposal')
        .mockResolvedValueOnce({ state: 'pending', id: '', choices: [] });

      expect(report.canBeCached()).rejects.toBe('PROPOSAL_NOT_CLOSED');
      expect(votesReportSpy).toHaveBeenCalled();
    });

    it('returns true when the proposal can be cached', async () => {
      const report = new VotesReport(id, storageEngine);
      const votesReportSpy = jest
        .spyOn(report, 'fetchProposal')
        .mockResolvedValueOnce({ state: 'closed', id: '', choices: [] });

      expect(await report.canBeCached()).toBe(true);
      expect(votesReportSpy).toHaveBeenCalled();
    });
  });

  describe('cachedFile()', () => {
    describe('when the cache exists', () => {
      it('returns a votes report', async () => {
        copyFileSync(fixtureFilePath(id), cachedFilePath(id));
        const report = new VotesReport(id, storageEngine);

        expect(await report.cachedFile()).toEqual(readFileSync(fixtureFilePath(id), 'utf8'));
      });
    });

    describe('when the cache does not exist', () => {
      it('returns false', async () => {
        const report = new VotesReport(id, storageEngine);

        expect(await report.cachedFile()).toEqual(false);
      });
    });
  });
});
