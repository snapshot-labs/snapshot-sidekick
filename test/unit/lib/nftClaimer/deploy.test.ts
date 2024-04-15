import { recoverAddress } from '@ethersproject/transactions';
import payload from '../../../../src/lib/nftClaimer/deploy';
import type { Space } from '../../../../src/helpers/snapshot';
import { signer } from '../../../../src/lib/nftClaimer/utils';

const mockFetchSpace = jest.fn((id: string): any => {
  return { id: id };
});
jest.mock('../../../../src/helpers/snapshot', () => ({
  __esModule: true,
  fetchSpace: (id: string) => mockFetchSpace(id)
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockValidateSpace = jest.fn((address: string, space: Space | null): any => {
  return true;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockValidateDeployInput = jest.fn((input: any): any => {
  return {};
});
jest.mock('../../../../src/lib/nftClaimer/utils', () => {
  const originalModule = jest.requireActual('../../../../src/lib/nftClaimer/utils');

  return {
    __esModule: true,
    ...originalModule,
    validateSpace: (address: string, space: Space | null) => mockValidateSpace(address, space),
    validateDeployInput: (input: any) => mockValidateDeployInput(input)
  };
});

const NAN = ['', false, null, 'test'];

describe('nftClaimer', () => {
  describe('payload()', () => {
    const spaceOwner = '0x5EF29cf961cf3Fc02551B9BdaDAa4418c446c5dd';
    const spaceTreasury = '0x5EF29cf961cf3Fc02551B9BdaDAa4418c446c5dd';
    const spaceId = 'TestDAO';
    const maxSupply = '10';
    const mintPrice = '100000000000000000';
    const proposerFee = '10';
    const salt = '72536493147621360896130495100276306361343381736075662552878320684807833746288';

    // Signature expected by the smart contract
    const expectedScSignature = {
      r: '0xd921452d76ea510debe0260f7eba6327e1cb7172e22fcc0179a734a3e7234ca2',
      s: '0x0ee9397c6c803436aac0c8c496c50264b68f6664f4940f7addc5f9140b8b8237',
      v: 27
    };

    const expectedDigest = '0xc3a4ff2bd44ee17fbc4f802953bd55392238b034c71ca4f5de2ad2f23fa31af7';
    const expectedInitializer =
      '0x977b0efb00000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000005ef29cf961cf3fc02551b9bdadaa4418c446c5dd0000000000000000000000005ef29cf961cf3fc02551b9bdadaa4418c446c5dd00000000000000000000000000000000000000000000000000000000000000075465737444414f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003302e310000000000000000000000000000000000000000000000000000000000';

    const input = {
      spaceOwner,
      id: spaceId,
      maxSupply,
      mintPrice,
      proposerFee,
      salt,
      spaceTreasury
    };

    function getPayload(customParams = {}) {
      return payload({ ...input, ...customParams });
    }

    describe('when deployable', () => {
      it.skip('generates the same signature as the smart contract from the data', async () => {
        mockValidateDeployInput.mockReturnValueOnce(input);

        const { signature } = await getPayload();

        expect(mockValidateSpace).toHaveBeenCalled();
        expect(mockValidateDeployInput).toHaveBeenCalled();
        expect(signature.r).toEqual(expectedScSignature.r);
        expect(signature.s).toEqual(expectedScSignature.s);
        expect(signature.v).toEqual(expectedScSignature.v);
      });

      it.skip('generates the same initializer as the smart contract from the data', async () => {
        mockValidateDeployInput.mockReturnValueOnce(input);

        const { initializer } = await getPayload();

        expect(mockValidateSpace).toHaveBeenCalled();
        expect(mockValidateDeployInput).toHaveBeenCalled();
        expect(initializer).toEqual(expectedInitializer);
      });

      it.skip('can recover the signer from the digest', async () => {
        mockValidateDeployInput.mockReturnValueOnce(input);

        const recoveredSigner = recoverAddress(expectedDigest, {
          r: expectedScSignature.r,
          s: expectedScSignature.s,
          v: expectedScSignature.v
        });

        expect(recoveredSigner).toEqual(signer.address);
      });
    });

    describe('when the space validation failed', () => {
      it.skip('throws an error', () => {
        mockValidateSpace.mockImplementation(() => {
          throw new Error();
        });

        expect(async () => await getPayload()).rejects.toThrow();
      });
    });

    describe('when passing invalid values', () => {
      it.skip('throws an error when the spaceOwer address is not valid', () => {
        expect(async () => await getPayload({ spaceOwner: 'test' })).rejects.toThrow();
      });

      it.skip('throws an error when the spaceTreasury address is not valid', () => {
        expect(async () => await getPayload({ spaceTreasury: 'test' })).rejects.toThrow();
      });

      it.each(NAN)('throws an error when the salt is not a number (%s)', val => {
        expect(async () => await getPayload({ salt: val as any })).rejects.toThrow();
      });

      it.each(NAN)('throws an error when the maxSupply is not a number (%s', val => {
        expect(async () => await getPayload({ maxSupply: val as any })).rejects.toThrow();
      });

      it.each(NAN)('throws an error when the mintPrice is not a number (%s)', val => {
        expect(async () => await getPayload({ mintPrice: val as any })).rejects.toThrow();
      });

      it.each(NAN)('throws an error when the proposerFee is not a number (%s)', val => {
        expect(async () => await getPayload({ proposerFee: val as any })).rejects.toThrow();
      });

      it.skip('throws an error when the proposerFee is out of range', () => {
        expect(async () => await getPayload({ proposerFee: '101' })).rejects.toThrow();
        expect(async () => await getPayload({ proposerFee: '-5' })).rejects.toThrow();
      });
    });
  });
});
