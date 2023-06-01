import getModerationList from '../../../src/lib/moderationList';
import { SqlFixtures } from '../../fixtures/moderation';

const mockDbQueryAsync = jest.fn((query: string, args?: string[]): any[] => {
  return [];
});
jest.mock('../../../src/helpers/mysql', () => ({
  __esModule: true,
  default: { queryAsync: (query: string, args?: string[]) => mockDbQueryAsync(query, args) }
}));

describe('moderationList', () => {
  it.each(['flaggedLinks', 'verifiedSpaces', 'flaggedProposals'])(
    'returns only the %s',
    async field => {
      mockDbQueryAsync.mockImplementationOnce(() => {
        return SqlFixtures[field];
      });

      const list = await getModerationList([field]);

      expect(list).toMatchSnapshot();
    }
  );

  it('returns multiple list: flaggedLinks and verifiedSpaces', async () => {
    mockDbQueryAsync.mockImplementationOnce(() => {
      return SqlFixtures.flaggedLinks.concat(SqlFixtures.verifiedSpaces);
    });

    const list = await getModerationList(['flaggedLinks', 'verifiedSpaces']);
    expect(list).toMatchSnapshot();
  });

  it('ignores invalid fields, and only returns verifiedSpaces', async () => {
    mockDbQueryAsync.mockImplementationOnce(() => {
      return SqlFixtures.verifiedSpaces;
    });

    const list = await getModerationList(['a', 'b', 'verifiedSpaces']);
    expect(list).toMatchSnapshot();
  });

  it('returns all fields by default', async () => {
    mockDbQueryAsync.mockImplementationOnce(() => {
      return Object.values(SqlFixtures).flat();
    });

    const list = await getModerationList();
    expect(list).toMatchSnapshot();
  });
});
