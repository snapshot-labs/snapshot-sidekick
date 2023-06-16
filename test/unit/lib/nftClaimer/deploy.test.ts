import { recoverAddress } from '@ethersproject/transactions';
import payload from '../../../../src/lib/nftClaimer/deploy';
import type { Space } from '../../../../src/helpers/snapshot';
import { signer } from '../../../../src/lib/nftClaimer/utils';

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
    const spaceOwner = '0x5EF29cf961cf3Fc02551B9BdaDAa4418c446c5dd';
    const spaceTreasury = '0x5EF29cf961cf3Fc02551B9BdaDAa4418c446c5dd';
    const spaceId = 'spaceId';
    const maxSupply = 10;
    const mintPrice = '100000000000000000';
    const proposerFee = 10;
    const salt = '72536493147621360896130495100276306361343381736075662552878320684807833746288';

    // Signature expected by the smart contract
    const expectedScSignature = {
      r: '0x6d13da6f9bb556a91520f41a75e17ca63984e37e5be699bae33dd8005f64d2d9',
      s: '0x049c36c5468f4e2b3d70db4cffc039bfc173ba482f2a1ac38703a62549edc533',
      v: 27
    };

    const expectedDigest = '0xbb8737c928264c8cb5196f59f8abd6cc95d2f728c28cdc1a9cb364c215365d9a';
    const expectedInitializer =
      '0xd5716032000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000005ef29cf961cf3fc02551b9bdadaa4418c446c5dd0000000000000000000000005ef29cf961cf3fc02551b9bdadaa4418c446c5dd00000000000000000000000000000000000000000000000000000000000000075465737444414f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003302e31000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000077370616365496400000000000000000000000000000000000000000000000000';

    describe('when mintable', () => {
      it('generates the same signature as the smart contract from the data', async () => {
        const { signature } = await payload(
          spaceOwner,
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
          spaceOwner,
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

        expect(recoveredSigner).toEqual(signer.address);
      });
    });
  });
});
