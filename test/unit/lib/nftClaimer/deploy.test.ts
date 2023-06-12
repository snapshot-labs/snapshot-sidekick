import { recoverAddress } from '@ethersproject/transactions';
import payload from '../../../../src/lib/nftClaimer/deploy';
import type { Space } from '../../../../src/helpers/snapshot';

const mockFetchSpace = jest.fn((id: string): any => {
  return { id: id, nftClaimer: { enabled: true } };
});
jest.mock('../../../../src/helpers/snapshot', () => ({
  __esModule: true,
  fetchSpace: (id: string) => mockFetchSpace(id)
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockValidateSpace = jest.fn((address: string, space: Space | null): any => {
  return true;
});
jest.mock('../../../../src/lib/nftClaimer/utils', () => {
  const originalModule = jest.requireActual('../../../../src/lib/nftClaimer/utils');

  return {
    __esModule: true,
    ...originalModule,
    validateSpace: (address: string, space: Space | null) => mockValidateSpace(address, space)
  };
});

describe('nftClaimer', () => {
  describe('payload()', () => {
    const signer = '0xD60349c24dB7F1053086eF0D6364b64B1e0313f0';
    const spaceTreasury = '0x0000000000000000000000000000000000003333';
    const spaceId = 'spaceId';
    const maxSupply = 10;
    const mintPrice = 1;
    const proposerFee = 10;
    const salt = '0x618f48e4d12670f57ebb3372d41a4462f8c4f79e5a44dbb9da442a83a50fca45';

    // Signature expected by the smart contract
    const expectedScSignature = {
      r: '0x15735f6737681613ffa00f26123f08962e65495b4b0ea49dabe16bf65fdcd34b',
      s: '0x4c31f952cf7335c4b50d85373d36036deddb66399c00bf3cf1ac88609ad9bc89',
      v: 28
    };

    const expectedDigest = '0x95f1c2d95a2d7918d1390e56ff2b5ccac5fd8c39985b6a7220cbd9432103b35b';
    const expectedInitializer =
      '0x964e3c39000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001e0000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d60349c24db7f1053086ef0d6364b64b1e0313f0000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000000000000000000000000000000000000022220000000000000000000000000000000000000000000000000000000000003333000000000000000000000000000000000000000000000000000000000000000b4e46542d434c41494d45520000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003302e31000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000077370616365496400000000000000000000000000000000000000000000000000';

    describe('when mintable', () => {
      it('generates the same signature as the smart contract from the data', async () => {
        const { signature } = await payload(
          signer,
          spaceId,
          maxSupply,
          mintPrice,
          proposerFee,
          salt,
          spaceTreasury
        );

        expect(mockValidateSpace).toHaveBeenCalled();
        expect(signature.r).toEqual(expectedScSignature.r);
        expect(signature.s).toEqual(expectedScSignature.s);
        expect(signature.v).toEqual(expectedScSignature.v);
      });

      it('generates the same initializer as the smart contract from the data', async () => {
        const { initializer } = await payload(
          signer,
          spaceId,
          maxSupply,
          mintPrice,
          proposerFee,
          salt,
          spaceTreasury
        );

        expect(mockValidateSpace).toHaveBeenCalled();
        expect(initializer).toEqual(expectedInitializer);
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
  });
});
