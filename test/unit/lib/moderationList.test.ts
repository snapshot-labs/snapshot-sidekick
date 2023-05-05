import path from 'path';
import * as testModerationList from '../../../src/lib/moderationList';

describe('moderationList', () => {
  it.each(['flaggedLinks', 'verifiedSpaces', 'flaggedProposalIds'])(
    'returns only the %s',
    field => {
      const filePathSpy = jest
        .spyOn(testModerationList, 'filePath')
        .mockReturnValue(path.resolve(__dirname, `../../fixtures/${field}.json`));

      const list = testModerationList.getModerationList([field]);
      expect(list).toMatchSnapshot();
      expect(filePathSpy).toHaveBeenCalledTimes(1);
    }
  );

  it('returns multiple fields', () => {
    const filePathSpy = jest
      .spyOn(testModerationList, 'filePath')
      .mockReturnValueOnce(path.resolve(__dirname, `../../fixtures/flaggedLinks.json`))
      .mockReturnValueOnce(path.resolve(__dirname, `../../fixtures/verifiedSpaces.json`));

    const list = testModerationList.getModerationList(['flaggedLinks', 'verifiedSpaces']);
    expect(list).toMatchSnapshot();
    expect(filePathSpy).toHaveBeenCalledTimes(2);
  });

  it('ignores invalid fields', () => {
    const filePathSpy = jest
      .spyOn(testModerationList, 'filePath')
      .mockReturnValue(path.resolve(__dirname, `../../fixtures/test.json`));

    const list = testModerationList.getModerationList(['a', 'b']);
    expect(list).toEqual({});
    expect(filePathSpy).toHaveBeenCalledTimes(0);
  });

  it('returns all fields by default', () => {
    const filePathSpy = jest
      .spyOn(testModerationList, 'filePath')
      .mockReturnValueOnce(path.resolve(__dirname, `../../fixtures/flaggedLinks.json`))
      .mockReturnValueOnce(path.resolve(__dirname, `../../fixtures/flaggedProposalIds.json`))
      .mockReturnValueOnce(path.resolve(__dirname, `../../fixtures/verifiedSpaces.json`));

    const list = testModerationList.getModerationList();
    expect(list).toMatchSnapshot();
    expect(filePathSpy).toHaveBeenCalledTimes(3);
  });
});
