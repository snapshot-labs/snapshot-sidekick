import { BigNumber } from '@ethersproject/bignumber';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { recoverAddress } from '@ethersproject/transactions';
import { getAddress } from '@ethersproject/address';
import { signValidProposal, signer } from '../../../src/lib/nftClaimer';

describe('nftClaimer', () => {
  const recipient = getAddress('0x0000000000000000000000000000000000001234');
  const proposalId = 42;
  const salt = 1;

  // Signature expected by the smart contract
  const expectedScSignature = {
    r: '0x1b9cd726a9ccc0a9d0c907ee1257346427b99d8ecad7f0b3fe3d352698a6cdaa',
    s: '0x1db817bb6460a819207155a7325519373a7b3f9be13ceadd1c36d759d749558d',
    v: 28
  };

  const expectedDigest = '0xd5f6e46573133935ac14cfcbc106b0a11234b78423c0561e7481e648d49e6c93';

  describe('signerAddress()', () => {
    it("returns the signer's public address", () => {
      expect(signer.address).toBe(process.env.NFT_CLAIMER_ADDRESS);
    });
  });

  describe('signValidProposal()', () => {
    it('generates the same signature as the smart contract', async () => {
      const signature = await signValidProposal(
        recipient,
        BigNumber.from(proposalId).toHexString(),
        salt
      );

      expect(signature.r).toEqual(expectedScSignature.r);
      expect(signature.s).toEqual(expectedScSignature.s);
      expect(signature.v).toEqual(expectedScSignature.v);
    });

    it('generates the same digest as the smart contract', () => {
      const digest = _TypedDataEncoder.hash(
        {
          name: 'NFT-CLAIMER',
          version: '0.1',
          chainId: '5',
          verifyingContract: '0x2e234DAe75C793f67A35089C9d99245E1C58470b'
        },
        {
          Mint: [
            { name: 'recipient', type: 'address' },
            { name: 'proposalId', type: 'uint256' },
            { name: 'salt', type: 'uint256' }
          ]
        },
        {
          recipient,
          proposalId,
          salt
        }
      );

      expect(digest).toEqual(expectedDigest);
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
