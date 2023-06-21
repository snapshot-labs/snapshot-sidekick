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
    r: '0xe63fd54360640015330a8f4589dfc3ceb23492ade38ef81f18f75825066a0be0',
    s: '0x745065b979a06d0bde23a1af591d8c3e5425528a064e2696025f1f47d5bfe4b9',
    v: 28
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
