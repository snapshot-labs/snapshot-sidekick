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
      r: '0x039cadeb14821207c5dbc7d569df1ef03352aee15e1712181a85c10d0d60ae2d',
      s: '0x734fbd8b1cf949a4e03701b74ed313860297e82a9634051696db534cec65305e',
      v: 27
    };

    const expectedDigest = '0x75689b38463a7915dadcf74806c66c05faec60128758a10562c07d359d232bf6';
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

        console.log(signature);

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
