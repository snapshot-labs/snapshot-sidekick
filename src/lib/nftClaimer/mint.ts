import { getAddress } from '@ethersproject/address';

import { splitSignature } from '@ethersproject/bytes';
import { BigNumber } from '@ethersproject/bignumber';
import { Proposal, fetchProposal } from '../../helpers/snapshot';
import { mintingAllowed, signer } from './utils';

const MintType = {
  Mint: [
    { name: 'recipient', type: 'address' },
    { name: 'proposalId', type: 'uint256' },
    { name: 'salt', type: 'uint256' }
  ]
};

const NFT_CLAIMER_NETWORK = process.env.NFT_CLAIMER_NETWORK || '1';

export async function signMint(address: string, id: string, salt: number) {
  const proposal = await fetchProposal(id);
  validateProposal(proposal);

  const message = {
    recipient: getAddress(address),
    proposalId: BigNumber.from(id).toString(),
    salt
  };

  // TODO
  // Enforce only proposal.space.id as allowed value on live prod
  const domain = 'TestTrustedBackend';

  return generateSignature(domain, message);
}

function validateProposal(proposal: Proposal | null) {
  if (!proposal) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if (!mintingAllowed(proposal.space)) {
    throw new Error('Space has not allowed minting');
  }
}

async function generateSignature(domain: string, message: Record<string, string | number>) {
  return splitSignature(
    await signer._signTypedData(
      {
        name: domain,
        version: '0.1',
        chainId: NFT_CLAIMER_NETWORK,
        verifyingContract: process.env.NFT_CLAIMER_VERIFYING_CONTRACT
      },
      MintType,
      message
    )
  );
}
