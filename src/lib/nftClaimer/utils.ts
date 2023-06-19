import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import fetch from 'cross-fetch';
import bs58 from 'bs58';
import snapshot from '@snapshot-labs/snapshot.js';
import { Wallet } from '@ethersproject/wallet';
import { getAddress } from '@ethersproject/address';
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

const HUB_NETWORK = process.env.NETWORK || '1';

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

  if (
    (process.env.NFT_CLAIMER_NETWORK !== '5' || process.env.NODE_ENV === 'test') &&
    (await snapshot.utils.getSpaceController(space.id, HUB_NETWORK)) !== getAddress(address)
  ) {
    throw new Error('Address is not the space owner');
  }
}

export function validateProposal(proposal: Proposal | null, proposer: string) {
  if (!proposal) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if (getAddress(proposer) !== getAddress(proposal.author as string)) {
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
  let value: any = id;
  if (id.match(/Qm[1-9A-HJ-NP-Za-km-z]{44}/)) {
    value = bs58.decode(id);
  }

  return BigNumber.from(value).toString();
}
