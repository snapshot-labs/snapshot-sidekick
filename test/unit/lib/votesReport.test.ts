import { copyFileSync, existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import VotesReport from '../../../src/lib/votesReport';
import FileStorage from '../../../src/lib/storage/file';

describe('VotesReport', () => {
  const id = '0x1e5fdb5c87867a94c1c7f27025d62851ea47f6072f2296ca53a48fce1b87cdef';
  const fixtureFile = `${__dirname}/../../fixtures/snapshot-votes-report-${id}.csv`;
  let cacheFolder: string;
  let cachePath: string;
  let cachedFile: string;
  let storageEngine: FileStorage;

  beforeEach(() => {
    cacheFolder = `votes-test-${Math.floor(Math.random() * 1e6)}`;
    cachePath = `${__dirname}/../../../tmp/${cacheFolder}`;
    cachedFile = `${cachePath}/snapshot-votes-report-${id}.csv`;
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

  it('caches a votes report', async () => {
    const report = new VotesReport(id, storageEngine);

    await report.generateCacheFile();

    return expect(readFileSync(cachedFile)).toEqual(readFileSync(fixtureFile));
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
        copyFileSync(fixtureFile, cachedFile);
        const report = new VotesReport(id, storageEngine);

        expect(await report.cachedFile()).toEqual(readFileSync(fixtureFile, 'utf8'));
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
