import {
  validateAddresses,
  validateProposal,
  validateProposerFee
} from '../../../../src/lib/nftClaimer/utils';

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

  describe('validateProposerFee()', () => {
    it('throws an error when proposerFee + snapshotFee > 100', () => {
      return expect(async () => {
        await validateProposerFee(100);
      }).rejects.toThrow();
    });
  });

  describe('validateProposal()', () => {
    it('throws an error when the proposalAuthor is not matching', () => {
      const address = '0x054a600d8B766c786270E25872236507D8459D8F';

      expect(async () => {
        validateProposal({ author: address } as any, '');
      }).rejects.toThrow();
    });

    it('throws an error when the proposal does not exist', () => {
      expect(async () => {
        validateProposal(null, '');
      }).rejects.toThrowError('RECORD_NOT_FOUND');
    });

    it.todo('throws an error when the space has closed minting');
  });
});
