import { BigNumber } from '@ethersproject/bignumber';
import { recoverAddress } from '@ethersproject/transactions';
import { getAddress } from '@ethersproject/address';
import payload from '../../../../src/lib/nftClaimer/mint';

const TEST_MINT_DOMAIN = 'TestDAO';
const proposer = '0x0000000000000000000000000000004242424242';

const mockFetchProposal = jest.fn((id: string): any => {
  return {
    id: id,
    author: proposer,
    space: { id: TEST_MINT_DOMAIN, nftClaimer: { enabled: true } }
  };
});
jest.mock('../../../../src/helpers/snapshot', () => ({
  __esModule: true,
  fetchProposal: (id: string) => mockFetchProposal(id)
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockGetProposalContract = jest.fn((id: string): any => {
  return '0x2e234DAe75C793f67A35089C9d99245E1C58470b';
});
jest.mock('../../../../src/lib/nftClaimer/utils', () => {
  // Require the original module to not be mocked...
  const originalModule = jest.requireActual('../../../../src/lib/nftClaimer/utils');

  return {
    __esModule: true,
    ...originalModule,
    getProposalContract: (id: string) => mockGetProposalContract(id)
  };
});

describe('nftClaimer', () => {
  describe('payload()', () => {
    const signer = '0xD60349c24dB7F1053086eF0D6364b64B1e0313f0';
    const recipient = getAddress('0x0000000000000000000000000000000000001234');
    const proposalId = 42;
    const hexProposalId = BigNumber.from(proposalId).toHexString();
    const salt = 0;

    // Signature expected by the smart contract
    const expectedScSignature = {
      r: '0xf27b32f51f5804eb53705e7c0e3c63169282f0ac83543f515970531650d42be4',
      s: '0x54124669256e730bc60147fb00afcf1d5f028045f15e7d5bd77b2093cd2f9554',
      v: 27
    };

    const expectedDigest = '0x65b2c526e8c21a68583765e51f03990a67a0a0cb46794ab7ec666e88808eb93a';

    describe('when mintable', () => {
      it('generates the same signature as the smart contract from the data', async () => {
        const { signature } = await payload(proposer, recipient, hexProposalId, salt);

        expect(mockFetchProposal).toHaveBeenCalledWith(hexProposalId);
        expect(signature.r).toEqual(expectedScSignature.r);
        expect(signature.s).toEqual(expectedScSignature.s);
        expect(signature.v).toEqual(expectedScSignature.v);
      });

      it('can recover the signer from the digest', async () => {
        const recoveredSigner = recoverAddress(expectedDigest, {
          r: expectedScSignature.r,
          s: expectedScSignature.s,
          v: expectedScSignature.v
        });

        expect(recoveredSigner).toEqual(signer);
      });
    });

    it('throws an error when the proposal does not exist', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mockFetchProposal.mockImplementationOnce((id: string) => null);

      expect(async () => await payload(proposer, recipient, hexProposalId, salt)).rejects.toThrow(
        'RECORD_NOT_FOUND'
      );
    });

    it('throws an error when the space has not allowed minting', () => {
      mockFetchProposal.mockImplementationOnce((id: string): any => {
        return {
          id: id,
          author: proposer,
          space: { id: TEST_MINT_DOMAIN, nftClaimer: { enabled: false } }
        };
      });

      expect(async () => await payload(proposer, recipient, hexProposalId, salt)).rejects.toThrow(
        /minting/
      );
    });
  });
});
