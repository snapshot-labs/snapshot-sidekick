import { BigNumber } from '@ethersproject/bignumber';
import { recoverAddress } from '@ethersproject/transactions';
import { getAddress } from '@ethersproject/address';
import { signMint } from '../../../src/lib/nftClaimer';

const TEST_DOMAIN = 'NFT-CLAIMER';

const mockFetchProposal = jest.fn((id: string): any => {
  return { id: id, space: { id: TEST_DOMAIN, nftClaimer: { enabled: true } } };
});
jest.mock('../../../src/helpers/snapshot', () => ({
  __esModule: true,
  fetchProposal: (id: string) => mockFetchProposal(id)
}));

describe('nftClaimer', () => {
  const recipient = getAddress('0x0000000000000000000000000000000000001234');
  const proposalId = 42;
  const hexProposalId = BigNumber.from(proposalId).toHexString();
  const salt = 1;

  // Signature expected by the smart contract
  const expectedScSignature = {
    r: '0x7da33fa78525bfadc622d103cbf2b24e8458738cf39c31c2ae82636e237f6bde',
    s: '0x3ca59107e30e3e02bd8783aac34cdf3af163e243ce47e5649eb39f9efb453b9f',
    v: 28
  };

  const expectedDigest = '0x92d00cfc08046cc4f5511b2f357c81c85c8b476ffb889f7b87153eebf716b7f9';

  describe('signMint()', () => {
    describe('when mintable', () => {
      it('generates the same signature as the smart contract from the data', async () => {
        const signature = await signMint(recipient, hexProposalId, salt);

        expect(mockFetchProposal).toHaveBeenCalledWith(hexProposalId);
        expect(signature.r).toEqual(expectedScSignature.r);
        expect(signature.s).toEqual(expectedScSignature.s);
        expect(signature.v).toEqual(expectedScSignature.v);
      });

      it('can recover the signer from the digest', async () => {
        const signer = recoverAddress(expectedDigest, {
          r: expectedScSignature.r,
          s: expectedScSignature.s,
          v: expectedScSignature.v
        });

        expect(signer).toEqual(process.env.NFT_CLAIMER_ADDRESS);
      });
    });

    it('throws an error when the proposal does not exist', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mockFetchProposal.mockImplementationOnce((id: string) => null);

      expect(async () => await signMint(recipient, hexProposalId, salt)).rejects.toThrow(
        'RECORD_NOT_FOUND'
      );
    });

    it('throws an error when the space has not allowed minting', () => {
      mockFetchProposal.mockImplementationOnce((id: string): any => {
        return { id: id, space: { id: TEST_DOMAIN, nftClaimer: { enabled: false } } };
      });

      expect(async () => await signMint(recipient, hexProposalId, salt)).rejects.toThrow(/minting/);
    });
  });
});
