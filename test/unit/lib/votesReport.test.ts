import { readFileSync, rmSync } from 'fs';
import VotesReport from '../../../src/lib/votesReport';
import { storageEngine } from '../../../src/helpers/utils';

const TEST_CACHE_DIR = 'test-cache';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockFetchProposal = jest.fn((id: string): any => {
  return [];
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockFetchVotes = jest.fn((id: string): any => {
  return [];
});
jest.mock('../../../src/helpers/snapshot', () => {
  const originalModule = jest.requireActual('../../../src/helpers/snapshot');

  return {
    __esModule: true,
    ...originalModule,
    fetchProposal: (id: string) => mockFetchProposal(id),
    fetchVotes: (id: string) => mockFetchVotes(id)
  };
});

describe('VotesReport', () => {
  const id = '0x1e5fdb5c87867a94c1c7f27025d62851ea47f6072f2296ca53a48fce1b87cdef';
  const weightedId = '0x79ae5f9eb3c710179cfbf706fa451459ddd18d4b0bce37c22aae601128efe927';
  const rankedChoiceId = '0xafe3a0426d4e6c645e869707f1b581765698d80c8d3e9cd37d7d3bf5e6f894e7';
  const approvalChoiceId = '0xe5e335af87dc10206e9f0de469f64901407837d659db6703cb3ea1437056a577';
  const quadraticChoiceId = '0x07387077920ce65b805bd0ba913a02ecfe63d22cac3dbaed3d97c23afd053fe2';
  const activeShutterId = '0xbb1b4f1f866fda9c1c19ff31bc32c98f92d70f2055a3ba26a502377cf2d1e743';
  const closedShutterId = '0x0da0673d17298e8f52c88385959952d21c2d0ae2fff2f0fea9df02ca0590cb6a';
  const testStorageEngine = storageEngine(TEST_CACHE_DIR);
  const space = { id: '', name: '', network: '', settings: '' };

  function fixtureFilePath(id: string) {
    return `${__dirname}/../../fixtures/snapshot-votes-report-${id}.csv`;
  }

  afterAll(() => {
    rmSync(testStorageEngine.path(), { recursive: true });
  });

  it.each([
    ['single', id],
    ['weighted', weightedId],
    ['ranked-choice', rankedChoiceId],
    ['approval', approvalChoiceId],
    ['quadratic', quadraticChoiceId],
    ['ranked-choice (active) with shutter', activeShutterId],
    ['ranked-choice (closed) with shutter', closedShutterId]
  ])('generates a %s choices votes report', async (type: string, pid: string) => {
    const report = new VotesReport(pid, testStorageEngine);
    mockFetchProposal.mockResolvedValueOnce(
      JSON.parse(readFileSync(`${__dirname}/../../fixtures/hub-proposal-${pid}.json`, 'utf8'))
    );
    mockFetchVotes.mockResolvedValueOnce(
      JSON.parse(readFileSync(`${__dirname}/../../fixtures/hub-votes-${pid}.json`, 'utf8'))
    );

    const content = await report.getContent();

    expect(content).toEqual(readFileSync(fixtureFilePath(pid), 'utf8'));
    expect(mockFetchProposal).toHaveBeenCalled();
    expect(mockFetchVotes).toHaveBeenCalled();
  });

  describe('isCacheable()', () => {
    it('raises an error when the proposal does not exist', () => {
      const report = new VotesReport('test', testStorageEngine);
      mockFetchProposal.mockResolvedValueOnce(null);

      expect(report.isCacheable()).rejects.toBe('RECORD_NOT_FOUND');
      expect(mockFetchProposal).toHaveBeenCalled();
    });

    it('raises an error when the proposal is not closed', async () => {
      const report = new VotesReport(id, testStorageEngine);
      mockFetchProposal.mockResolvedValueOnce({
        state: 'pending',
        id: '',
        title: '',
        votes: 0,
        author: '',
        choices: [],
        space
      });

      expect(report.isCacheable()).rejects.toBe('RECORD_NOT_FOUND');
      expect(mockFetchProposal).toHaveBeenCalled();
    });

    it('returns true when the proposal can be cached', async () => {
      const report = new VotesReport(id, testStorageEngine);
      mockFetchProposal.mockResolvedValueOnce({
        state: 'closed',
        id: '',
        title: '',
        votes: 0,
        author: '',
        choices: [],
        space
      });

      expect(await report.isCacheable()).toBe(true);
      expect(mockFetchProposal).toHaveBeenCalled();
    });
  });
});
