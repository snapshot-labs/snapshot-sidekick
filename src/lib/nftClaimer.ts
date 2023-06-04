import { getAddress } from '@ethersproject/address';
import { Wallet } from '@ethersproject/wallet';
import { splitSignature } from '@ethersproject/bytes';
import snapshot from '@snapshot-labs/snapshot.js';
import type { TypedDataField } from '@ethersproject/abstract-signer';
import { fetchProposal, fetchSpace, Space } from '../helpers/snapshot';

const domain = {
  name: 'SpaceName',
  version: '0.1',
  chainId: '5' //TODO Use process.env.NETWORK once live
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

const NETWORK = process.env.NETWORK || '1';
const PRIVATE_KEY = process.env.NFT_CLAIMER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error('NFT Claimer private key missing');
}

const signer = new Wallet(PRIVATE_KEY);

async function sign(message: Record<string, any>, type: Record<string, Array<TypedDataField>>) {
  return splitSignature(await signer._signTypedData(domain, type, message));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mintingAllowed(space: Space) {
  // TODO: Placeholder only for tests, remove once hub return nftClaimer results
  // https://github.com/snapshot-labs/snapshot-hub/pull/581
  // https://github.com/snapshot-labs/snapshot.js/pull/823
  return true;

  // return space.nftClaimer && space.nftClaimer.address && space.nftClaimer.enabled;
}

export async function signSpaceOwner(address: string, id: string, salt: number) {
  const space = await fetchSpace(id);

  if (!space) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if ((await snapshot.utils.getSpaceController(id, NETWORK)) !== getAddress(address)) {
    throw new Error('Address is not the space owner');
  }

  if (!mintingAllowed(space)) {
    throw new Error('Space has not allowed minting');
  }

  return sign({ address: getAddress(address), spaceId: id, salt }, SpaceType);
}

export async function signValidProposal(address: string, id: string, salt: number) {
  const proposal = await fetchProposal(id);

  if (!proposal) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if (!mintingAllowed(proposal.space)) {
    throw new Error('Space has not allowed minting');
  }

  return sign({ recipient: getAddress(address), proposalId: id, salt }, MintType);
}
