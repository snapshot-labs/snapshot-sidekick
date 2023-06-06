import { recoverAddress } from '@ethersproject/transactions';
import { signDeploy } from '../../../../src/lib/nftClaimer/deploy';

const mockFetchSpace = jest.fn((id: string): any => {
  return { id: id, nftClaimer: { enabled: true } };
});
jest.mock('../../../../src/helpers/snapshot', () => ({
  __esModule: true,
  fetchSpace: (id: string) => mockFetchSpace(id)
}));

describe('nftClaimer', () => {
  describe('signDeploy()', () => {
    const spaceId = 1337;
    const maxSupply = 10;
    const mintPrice = 1;
    const salt = '0x618f48e4d12670f57ebb3372d41a4462f8c4f79e5a44dbb9da442a83a50fca45';

    // Signature expected by the smart contract
    const expectedScSignature = {
      r: '0x15735f6737681613ffa00f26123f08962e65495b4b0ea49dabe16bf65fdcd34b',
      s: '0x4c31f952cf7335c4b50d85373d36036deddb66399c00bf3cf1ac88609ad9bc89',
      v: 28
    };

    const expectedDigest = '0x0eb8d4d54b248ac944fbde5709d650affe82920266be33f828641a6b906231f3';
    // const expectedInitializer =
    //   '0x911a4f6c00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000539000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d60349c24db7f1053086ef0d6364b64b1e0313f0000000000000000000000000000000000000000000000000000000000000abcd000000000000000000000000000000000000000000000000000000000000000b4e46542d434c41494d45520000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003302e310000000000000000000000000000000000000000000000000000000000';

    describe('when mintable', () => {
      it('generates the same signature as the smart contract from the data', async () => {
        const signature = await signDeploy(
          process.env.NFT_CLAIMER_ADDRESS as string,
          spaceId,
          maxSupply,
          mintPrice,
          salt
        );

        // expect(mockFetchSpace).toHaveBeenCalledWith(spaceId);
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
  });
});
