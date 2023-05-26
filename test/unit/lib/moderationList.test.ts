import getModerationList, { initFiles } from '../../../src/lib/moderationList';

describe('moderationList', () => {
  beforeEach(() => {
    initFiles();
  });

  it.each(['flaggedLinks', 'verifiedSpaces', 'flaggedProposals'])('returns only the %s', field => {
    const list = getModerationList([field]);
    expect(list).toMatchSnapshot();
  });

  it('returns multiple list: flaggedLinks and verifiedSpaces', () => {
    const list = getModerationList(['flaggedLinks', 'verifiedSpaces']);
    expect(list).toMatchSnapshot();
  });

  it('ignores invalid fields, and only returns verifiedSpaces', () => {
    const list = getModerationList(['a', 'b', 'verifiedSpaces']);
    expect(list).toMatchSnapshot();
  });

  it('returns all fields by default', () => {
    const list = getModerationList();
    expect(list).toMatchSnapshot();
  });
});
