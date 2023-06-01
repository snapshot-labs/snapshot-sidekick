import { BigNumber } from '@ethersproject/bignumber';
import { recoverAddress } from '@ethersproject/transactions';
import { getAddress } from '@ethersproject/address';
import { signMint } from '../../../src/lib/nftClaimer';

const TEST_DOMAIN = 'TestTrustedBackend';

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
  const salt = 0;

  // Signature expected by the smart contract
  const expectedScSignature = {
    r: '0x1d9a724d7da1d2d85b1da09ce5ea5f7a5d797a39cdcec6deb884ab3f8203192d',
    s: '0x10af673455278ac7f4cdeb608bc0ac1ac46a5fdff10afb4b607c8b23d871cc1e',
    v: 27
  };

  const expectedDigest = '0xa2075324f2af7babd621b5dcacce268ac105cb716d3c11ffe8818181ff45b29b';

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
