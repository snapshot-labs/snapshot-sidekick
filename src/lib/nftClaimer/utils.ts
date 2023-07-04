import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import fetch from 'cross-fetch';
import snapshot from '@snapshot-labs/snapshot.js';
import { CID } from 'multiformats/cid';
import { Wallet } from '@ethersproject/wallet';
import { getAddress, isAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import type { Proposal, Space } from '../../helpers/snapshot';

const requiredEnvKeys = [
  'NFT_CLAIMER_PRIVATE_KEY',
  'NFT_CLAIMER_NETWORK',
  'NFT_CLAIMER_DEPLOY_VERIFYING_CONTRACT',
  'NFT_CLAIMER_DEPLOY_IMPLEMENTATION_ADDRESS',
  'NFT_CLAIMER_DEPLOY_INITIALIZE_SELECTOR',
  'NFT_CLAIMER_SUBGRAPH_URL'
];

const HUB_NETWORK = process.env.HUB_URL === 'https://hub.snapshot.org' ? '1' : '5';

const missingEnvKeys: string[] = [];
requiredEnvKeys.forEach(key => {
  if (!process.env[key]) {
    missingEnvKeys.push(key);
  }
});

if (missingEnvKeys.length > 0) {
  throw new Error(
    `NFT Claimer not configured properly, missing env keys: ${missingEnvKeys.join(', ')}`
  );
}

export const signer = new Wallet(process.env.NFT_CLAIMER_PRIVATE_KEY as string);

async function mintingAllowed(space: Space) {
  return (await getSpaceCollection(space.id)).enabled;
}

export async function validateSpace(address: string, space: Space | null) {
  if (!space) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if (process.env.NFT_CLAIMER_NETWORK !== '5' && !(await isSpaceOwner(space.id, address))) {
    throw new Error('Address is not the space owner');
  }

  const contract = await getSpaceCollection(space.id);
  if (contract) {
    throw new Error(`SpaceCollection contract already exist (${contract.id})`);
  }
}

async function isSpaceOwner(spaceId: string, address: string) {
  return (await snapshot.utils.getSpaceController(spaceId, HUB_NETWORK)) === getAddress(address);
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
  link: new HttpLink({ uri: process.env.NFT_CLAIMER_SUBGRAPH_URL, fetch }),
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
