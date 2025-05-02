import { BigNumber } from '@ethersproject/bignumber';
import { recoverAddress } from '@ethersproject/transactions';
import { getAddress } from '@ethersproject/address';
import payload from '../../../../src/lib/nftClaimer/mint';

const TEST_MINT_DOMAIN = 'TestDAO';
const proposer = '0x0000000000000000000000000000004242424242';

const NAN = ['', false, null, 'test'];

const mockFetchProposal = jest.fn((id: string): any => {
  return {
    id: id,
    author: proposer,
    space: { id: TEST_MINT_DOMAIN }
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockValidateProposal = jest.fn((proposal: any): void => {
  return;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockMintingAllowed = jest.fn((space: any): boolean => {
  return true;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockHasVoted = jest.fn((address: string, proposal: string): boolean => {
  return true;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockHasMinted = jest.fn((address: string, proposal: string): boolean => {
  return false;
});
jest.mock('../../../../src/lib/nftClaimer/utils', () => {
  // Require the original module to not be mocked...
  const originalModule = jest.requireActual('../../../../src/lib/nftClaimer/utils');

  return {
    __esModule: true,
    ...originalModule,
    getProposalContract: (id: string) => mockGetProposalContract(id),
    validateProposal: (id: any) => mockValidateProposal(id),
    mintingAllowed: (space: any) => mockMintingAllowed(space),
    hasVoted: (address: string, proposal: string) => mockHasVoted(address, proposal),
    hasMinted: (address: string, proposal: string) => mockHasMinted(address, proposal)
  };
});

describe('nftClaimer', () => {
  describe('payload()', () => {
    const signer = '0xD60349c24dB7F1053086eF0D6364b64B1e0313f0';
    const recipient = getAddress('0x0000000000000000000000000000000000001234');
    const proposalId = 42;
    const hexProposalId = BigNumber.from(proposalId).toHexString();
    const salt = '0';

    // Signature expected by the smart contract
    const expectedScSignature = {
      r: '0xf27b32f51f5804eb53705e7c0e3c63169282f0ac83543f515970531650d42be4',
      s: '0x54124669256e730bc60147fb00afcf1d5f028045f15e7d5bd77b2093cd2f9554',
      v: 27
    };

    const expectedDigest = '0x65b2c526e8c21a68583765e51f03990a67a0a0cb46794ab7ec666e88808eb93a';

    const input = {
      proposalAuthor: proposer,
      recipient,
      id: hexProposalId,
      salt
    };

    async function getPayload(customParams = {}) {
      return payload({ ...input, ...customParams });
    }

    describe('when mintable', () => {
      it.skip('generates the same signature as the smart contract from the data', async () => {
        const { signature } = await getPayload();

        expect(mockFetchProposal).toHaveBeenCalledWith(hexProposalId);
        expect(signature.r).toEqual(expectedScSignature.r);
        expect(signature.s).toEqual(expectedScSignature.s);
        expect(signature.v).toEqual(expectedScSignature.v);
      });

      it.skip('can recover the signer from the digest', async () => {
        const recoveredSigner = recoverAddress(expectedDigest, {
          r: expectedScSignature.r,
          s: expectedScSignature.s,
          v: expectedScSignature.v
        });

        expect(recoveredSigner).toEqual(signer);
      });
    });

    describe('when spaceCollection is not found', () => {
      it.skip('throws a SpaceCollection not found error', async () => {
        mockGetProposalContract.mockImplementationOnce(() => {
          throw new Error();
        });
        return expect(async () => await getPayload()).rejects.toThrow();
      });
    });

    describe('when space has closed minting', () => {
      it.skip('throws an error', () => {
        mockMintingAllowed.mockReturnValueOnce(false);
        return expect(async () => await payload(input)).rejects.toThrow();
      });
    });

    describe('when address has not voted on the proposal', () => {
      it.skip('throws an error', () => {
        mockHasVoted.mockReturnValueOnce(false);
        return expect(async () => await payload(input)).rejects.toThrow();
      });
    });

    describe('when address has already minted', () => {
      it.skip('throws an error', () => {
        mockHasMinted.mockReturnValueOnce(true);
        return expect(async () => await payload(input)).rejects.toThrow();
      });
    });

    describe('when maxSupply has been reached', () => {
      it.todo('throws an error');
    });

    describe('when passing invalid values', () => {
      it.skip('throws an error when the proposalAuthor address is not valid', () => {
        expect(async () => getPayload({ proposalAuthor: 'test' })).rejects.toThrow();
      });

      it.skip('throws an error when the recipient address is not valid', () => {
        expect(
          async () =>
            await getPayload({
              recipient: 'test'
            })
        ).rejects.toThrow();
      });

      it.each(NAN)('throws an error when the salt is not a number (%s)', val => {
        return expect(
          async () =>
            await getPayload({
              salt: val as any
            })
        ).rejects.toThrow();
      });

      it.skip('throws an error when the proposal is not found', () => {
        mockFetchProposal.mockReturnValueOnce(null);
        return expect(getPayload()).rejects.toThrow();
      });
    });
  });
});
