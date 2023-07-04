import { validateAddresses } from '../../../../src/lib/nftClaimer/utils';

describe('NFTClaimer/utils', () => {
  describe('validateAddresses()', () => {
    it('returns true when all addresses are valid', () => {
      expect(
        validateAddresses({
          contractA: '0x054a600d8B766c786270E25872236507D8459D8F',
          contractB: '0x33505720a7921d23E6b02EB69623Ed6A008Ca511'
        })
      ).toBe(true);
    });
    it('throws an error when some of the addresses are invalid', () => {
      expect(() => {
        validateAddresses({
          contractA: '0x054a600d8B766c786270E25872236507D8459D8F',
          contractB: 'hello-world'
        });
      }).toThrowError();
    });
  });
});
