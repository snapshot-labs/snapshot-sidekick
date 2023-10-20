import { Proposal } from '../../../../src/helpers/snapshot';
import { hasVoted } from '../../../../src/lib/nftClaimer/utils';

describe('nftClaimer/utils', () => {
  describe('hasVoted()', () => {
    it('returns true when the address has voted on the given proposal', () => {
      expect(
        hasVoted('0x96176C25803Ce4cF046aa74895646D8514Ea1611', {
          id: 'QmPvbwguLfcVryzBRrbY4Pb9bCtxURagdv1XjhtFLf3wHj'
        } as Proposal)
      ).resolves.toBe(true);
    });

    it('returns false when the address has not voted on the given proposal', () => {
      expect(
        hasVoted('0x96176C25803Ce4cF046aa74895646D8514Ea1611', {
          id: '0xcf201ad7a32dcd399654c476093f079554dae429a13063f50d839e5621cd2e6e'
        } as Proposal)
      ).resolves.toBe(false);
    });
  });
});
