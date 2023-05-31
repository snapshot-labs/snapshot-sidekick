import { getAddress } from '@ethersproject/address';
import { Wallet } from '@ethersproject/wallet';
import { splitSignature } from '@ethersproject/bytes';
import snapshot from '@snapshot-labs/snapshot.js';
import { fetchProposal, fetchSpace, Space } from '../helpers/snapshot';

const SpaceType = {
  Space: [
    { name: 'address', type: 'address' },
    { name: 'spaceId', type: 'string' },
    { name: 'salt', type: 'uint256' }
  ]
};

const MintType = {
  Mint: [
    { name: 'recipient', type: 'address' },
    { name: 'proposalId', type: 'uint256' },
    { name: 'salt', type: 'uint256' }
  ]
};

const HUB_NETWORK = process.env.NETWORK || '1';
const NFT_CLAIMER_NETWORK = process.env.NFT_CLAIMER_NETWORK || '1';

const signer = new Wallet(process.env.WALLET_PRIVATE_KEY as string);

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

  if ((await snapshot.utils.getSpaceController(id, HUB_NETWORK)) !== getAddress(address)) {
    throw new Error('Address is not the space owner');
  }

  if (!mintingAllowed(space)) {
    throw new Error('Space has not allowed minting');
  }

  return splitSignature(
    await signer._signTypedData(
      {
        name: 'SpaceName',
        version: '0.1',
        chainId: NFT_CLAIMER_NETWORK
      },
      SpaceType,
      { address: getAddress(address), spaceId: id, salt }
    )
  );
}

export async function signValidProposal(address: string, id: string, salt: number) {
  const proposal = await fetchProposal(id);

  if (!proposal) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if (!mintingAllowed(proposal.space)) {
    throw new Error('Space has not allowed minting');
  }

  return splitSignature(
    await signer._signTypedData(
      {
        name: 'TestTrustedBackend',
        version: '0.1',
        chainId: NFT_CLAIMER_NETWORK
      },
      MintType,
      { recipient: getAddress(address), proposalId: 100, salt }
    )
  );
}
