import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import fetch from 'cross-fetch';
import { Wallet } from '@ethersproject/wallet';
import { getAddress } from '@ethersproject/address';
import snapshot from '@snapshot-labs/snapshot.js';
import type { Proposal, Space } from '../../helpers/snapshot';

const requiredEnvKeys = [
  'NFT_CLAIMER_PRIVATE_KEY',
  'NFT_CLAIMER_DEPLOY_VERIFYING_CONTRACT',
  'NFT_CLAIMER_DEPLOY_IMPLEMENTATION_ADDRESS',
  'NFT_CLAIMER_DEPLOY_INITIALIZE_SELECTOR'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mintingAllowed(space: Space) {
  // TODO: Placeholder only for tests, remove once hub return nftClaimer results
  // https://github.com/snapshot-labs/snapshot-hub/pull/581
  // https://github.com/snapshot-labs/snapshot.js/pull/823
  return space.nftClaimer?.enabled ?? true;

  // return space.nftClaimer && space.nftClaimer.address && space.nftClaimer.enabled;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function validateSpace(address: string, space: Space | null) {
  if (!space) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if ((await snapshot.utils.getSpaceController(space.id, HUB_NETWORK)) !== getAddress(address)) {
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

export async function getProposalContract(proposal: Proposal) {
  return (await getSpaceCollection(proposal.space.id)).id;
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
    }
  }
`;

type SpaceCollection = {
  id: string;
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