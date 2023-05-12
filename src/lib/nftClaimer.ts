import { getAddress } from '@ethersproject/address';
import { Wallet } from '@ethersproject/wallet';
import snapshot from '@snapshot-labs/snapshot.js';
import type { TypedDataField } from '@ethersproject/abstract-signer';
import { fetchProposal, fetchSpace, Space } from '../helpers/snapshot';

const domain = {
  name: 'SpaceName',
  version: '0.1',
  chainId: '137'
};

export const SpaceType = {
  Space: [
    { name: 'address', type: 'address' },
    { name: 'spaceId', type: 'string' },
    { name: 'salt', type: 'uint256' }
  ]
};

export const MintType = {
  Space: [
    { name: 'recipient', type: 'address' },
    { name: 'proposalId', type: 'uint256' },
    { name: 'salt', type: 'uint256' }
  ]
};

export const UnsubscribeTypes = {
  Unsubscribe: [{ name: 'email', type: 'string' }]
};

const signer = new Wallet(process.env.WALLET_PRIVATE_KEY as string);

async function sign(message: Record<string, any>, type: Record<string, Array<TypedDataField>>) {
  return await signer._signTypedData(domain, type, message);
}

function mintingAllowed(space: Space) {
  return space.nftClaimer && space.nftClaimer.address && space.nftClaimer.enabled;
}

export async function signSpaceOwner(address: string, id: string, salt: number) {
  const space = await fetchSpace(id);

  if (!space) {
    throw new Error('SPACE_NOT_FOUND');
  }

  if ((await snapshot.utils.getSpaceController(id, space.network)) !== getAddress(address)) {
    throw new Error('Address is not space owner');
  }

  if (!mintingAllowed(space)) {
    throw new Error('Space has not allowed minting');
  }

  return sign({ address: getAddress(address), spaceId: id, salt }, SpaceType);
}

export async function signValidProposal(address: string, id: string, salt: number) {
  const proposal = await fetchProposal(id);

  if (!proposal) {
    throw new Error('PROPOSAL_NOT_FOUND');
  }

  if (!mintingAllowed(proposal.space)) {
    throw new Error('Space has not allowed minting');
  }

  return sign({ recipient: getAddress(address), proposalId: id, salt }, SpaceType);
}
