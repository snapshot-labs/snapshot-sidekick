import getModerationList from '../../../src/lib/moderationList';
import { SqlFixtures } from '../../fixtures/moderation';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockDbQueryAsync = jest.fn((query: string, args?: string[]): any[] => {
  return [];
});
jest.mock('../../../src/helpers/mysql', () => ({
  __esModule: true,
  default: { queryAsync: (query: string, args?: string[]) => mockDbQueryAsync(query, args) }
}));

describe('moderationList', () => {
  it.each(['flaggedLinks', 'flaggedIps'])('returns only the %s', async field => {
    mockDbQueryAsync.mockImplementationOnce(() => {
      return SqlFixtures[field];
    });

    const list = await getModerationList([field]);

    expect(list).toMatchSnapshot();
  });

  it('returns multiple list: flaggedLinks and flaggedIps', async () => {
    mockDbQueryAsync.mockImplementationOnce(() => {
      return SqlFixtures.flaggedLinks.concat(SqlFixtures.flaggedIps);
    });

    const list = await getModerationList(['flaggedLinks', 'flaggedIps']);
    expect(list).toMatchSnapshot();
  });

  it('ignores invalid fields, and only returns flaggedIps', async () => {
    mockDbQueryAsync.mockImplementationOnce(() => {
      return SqlFixtures.flaggedIps;
    });

    const list = await getModerationList(['a', 'b', 'flaggedIps']);
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
