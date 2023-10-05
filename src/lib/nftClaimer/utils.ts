import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import snapshot from '@snapshot-labs/snapshot.js';
import { CID } from 'multiformats/cid';
import { Wallet } from '@ethersproject/wallet';
import { Contract } from '@ethersproject/contracts';
import { getAddress, isAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { fetchVote, type Proposal, type Space } from '../../helpers/snapshot';
import { fetchWithKeepAlive } from '../../helpers/utils';

const requiredEnvKeys = [
  'NFT_CLAIMER_PRIVATE_KEY',
  'NFT_CLAIMER_NETWORK',
  'NFT_CLAIMER_DEPLOY_VERIFYING_CONTRACT',
  'NFT_CLAIMER_DEPLOY_IMPLEMENTATION_ADDRESS',
  'NFT_CLAIMER_DEPLOY_INITIALIZE_SELECTOR',
  'NFT_CLAIMER_SUBGRAPH_URL'
];

const missingEnvKeys: string[] = [];
requiredEnvKeys.forEach(key => {
  if (!process.env[key]) {
    missingEnvKeys.push(key);
  }
});
const broviderUrl = process.env.BROVIDER_URL || 'https://rpc.snapshot.org';

if (missingEnvKeys.length > 0) {
  throw new Error(
    `NFT Claimer not configured properly, missing env keys: ${missingEnvKeys.join(', ')}`
  );
}

const hardcodedHubNetwork = process.env.HUB_URL === 'https://hub.snapshot.org' ? '1' : '5';
const HUB_NETWORK = process.env.HUB_NETWORK || hardcodedHubNetwork;
const DEPLOY_CONTRACT = getAddress(process.env.NFT_CLAIMER_DEPLOY_VERIFYING_CONTRACT as string);
const NFT_CLAIMER_NETWORK = parseInt(process.env.NFT_CLAIMER_NETWORK as string);

export const signer = new Wallet(process.env.NFT_CLAIMER_PRIVATE_KEY as string);

export async function mintingAllowed(space: Space) {
  return (await getSpaceCollection(space.id)).enabled;
}

export async function hasVoted(address: string, proposal: Proposal) {
  const vote = await fetchVote(address, proposal.id);
  return vote !== undefined;
}

export async function validateSpace(address: string, space: Space | null) {
  if (!space) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if (NFT_CLAIMER_NETWORK !== 5 && !(await isSpaceOwner(space.id, address))) {
    throw new Error('Address is not the space owner');
  }

  const contract = await getSpaceCollection(space.id);
  if (contract) {
    throw new Error(`SpaceCollection contract already exist (${contract.id})`);
  }
}

async function isSpaceOwner(spaceId: string, address: string) {
  const spaceController = await snapshot.utils.getSpaceController(spaceId, HUB_NETWORK, {
    broviderUrl
  });
  return spaceController === getAddress(address);
}

export function validateProposal(proposal: Proposal | null, proposer: string) {
  if (!proposal) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if (getAddress(proposer) !== getAddress(proposal.author)) {
    throw new Error('Proposal author is not matching');
  }

  if (!mintingAllowed(proposal.space)) {
    throw new Error('Space has not allowed minting');
  }
}

export async function getProposalContract(spaceId: string) {
  const contract = await getSpaceCollection(spaceId);

  if (!contract) {
    throw new Error(`SpaceCollection contract is not found for space ${spaceId}`);
  }

  return contract.id;
}

const client = new ApolloClient({
  link: new HttpLink({ uri: process.env.NFT_CLAIMER_SUBGRAPH_URL, fetch: fetchWithKeepAlive }),
  cache: new InMemoryCache({
    addTypename: false
  }),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache'
    }
  }
});

const SPACE_COLLECTION_QUERY = gql`
  query SpaceCollections($spaceId: String) {
    spaceCollections(where: { spaceId: $spaceId }, first: 1) {
      id
      enabled
    }
  }
`;

type SpaceCollection = {
  id: string;
  enabled: boolean;
};

export async function getSpaceCollection(spaceId: string) {
  const {
    data: { spaceCollections }
  }: { data: { spaceCollections: SpaceCollection[] } } = await client.query({
    query: SPACE_COLLECTION_QUERY,
    variables: {
      spaceId
    }
  });

  return spaceCollections[0];
}

export function numberizeProposalId(id: string) {
  return BigNumber.from(id.startsWith('0x') ? id : CID.parse(id).bytes).toString();
}

export function validateAddresses(addresses: Record<string, string>) {
  Object.entries(addresses).forEach(([key, value]) => {
    if (!isAddress(value)) {
      throw new Error(`Value for ${key} is not a valid address (${value})`);
    }
  });

  return true;
}

function validateNumbers(numbers: Record<string, string>) {
  Object.entries(numbers).forEach(([key, value]) => {
    try {
      BigNumber.from(value).toString();
    } catch (e: any) {
      throw new Error(`Value for ${key} is not a valid number (${value})`);
    }
  });

  return true;
}

export async function validateProposerFee(fee: number) {
  if (fee < 0 || fee > 100) {
    throw new Error('proposerFee should be between 0 and 100');
  }

  const sFee = await snapshotFee();
  if (sFee + fee > 100) {
    throw new Error(`proposerFee should not be greater than ${100 - sFee}`);
  }

  return true;
}

export async function validateDeployInput(params: any) {
  validateAddresses({ spaceOwner: params.spaceOwner, spaceTreasury: params.spaceTreasury });
  validateNumbers({
    maxSupply: params.maxSupply,
    proposerFee: params.proposerFee,
    mintPrice: params.mintPrice,
    salt: params.salt
  });
  await validateProposerFee(parseInt(params.proposerFee));

  return {
    spaceOwner: getAddress(params.spaceOwner),
    spaceTreasury: getAddress(params.spaceTreasury),
    proposerFee: parseInt(params.proposerFee),
    maxSupply: parseInt(params.maxSupply),
    mintPrice: parseInt(params.mintPrice),
    ...params
  };
}

export async function validateMintInput(params: any) {
  validateAddresses({ proposalAuthor: params.proposalAuthor, recipient: params.recipient });
  validateNumbers({
    salt: params.salt
  });

  return {
    proposalAuthor: getAddress(params.proposalAuthor),
    recipient: getAddress(params.recipient),
    ...params
  };
}

export async function snapshotFee(): Promise<number> {
  try {
    const provider = snapshot.utils.getProvider(NFT_CLAIMER_NETWORK, { broviderUrl });
    const contract = new Contract(
      DEPLOY_CONTRACT,
      ['function snapshotFee() public view returns (uint8)'],
      provider
    );

    return contract.snapshotFee();
  } catch (e: any) {
    capture(e);
    throw 'Unable to retrieve the snapshotFee';
  }
}
