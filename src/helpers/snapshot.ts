import { gql, ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { fetchWithKeepAlive } from './utils';

export type Proposal = {
  id: string;
  state: 'pending' | 'active' | 'closed';
  choices: string[];
  space: Space;
  votes: number;
  author: string;
  title: string;
  body: string;
  discussion: string;
  updated: number;
};

export type Vote = {
  ipfs: string;
  voter: string;
  choice: Record<string, number> | number;
  vp: number;
  reason: string;
  created: number;
};

export type Space = {
  id: string;
  network: string;
  name: string;
};

const httpLink = createHttpLink({
  uri: `${process.env.HUB_URL || 'https://hub.snapshot.org'}/graphql`,
  fetch: fetchWithKeepAlive
});

const authLink = setContext((_, { headers }) => {
  const apiHeaders: Record<string, string> = {};
  const apiKey = process.env.KEYCARD_API_KEY;

  if (apiKey && apiKey.length > 0) {
    apiHeaders['x-api-key'] = apiKey;
  }

  return {
    headers: {
      ...headers,
      ...apiHeaders
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    addTypename: false
  }),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache'
    }
  }
});

const PROPOSAL_QUERY = gql`
  query Proposal($id: String) {
    proposal(id: $id) {
      id
      state
      choices
      votes
      title
      body
      discussion
      author
      space {
        id
        network
        name
      }
      updated
    }
  }
`;

const VOTES_QUERY = gql`
  query Votes(
    $id: String!
    $first: Int
    $skip: Int
    $orderBy: String
    $orderDirection: OrderDirection
    $created_gte: Int
  ) {
    votes(
      first: $first
      skip: $skip
      where: { proposal: $id, created_gte: $created_gte }
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      ipfs
      voter
      choice
      vp
      reason
      created
    }
  }
`;

const VOTE_QUERY = gql`
  query Votes($voter: String!, $proposalId: String!) {
    votes(first: 1, where: { voter: $voter, proposal: $proposalId }) {
      id
    }
  }
`;

const SPACE_QUERY = gql`
  query Space($id: String) {
    space(id: $id) {
      id
      network
    }
  }
`;

export async function fetchProposal(id: string) {
  const {
    data: { proposal }
  }: { data: { proposal: Proposal | null } } = await client.query({
    query: PROPOSAL_QUERY,
    variables: {
      id
    }
  });

  return proposal;
}

export async function fetchVotes(
  id: string,
  { first = 1000, skip = 0, orderBy = 'created_gte', orderDirection = 'asc', created_gte = 0 } = {}
) {
  const {
    data: { votes }
  }: { data: { votes: Vote[] } } = await client.query({
    query: VOTES_QUERY,
    variables: {
      id,
      orderBy,
      orderDirection,
      first,
      skip,
      created_gte
    }
  });

  return votes;
}

export async function fetchVote(voter: string, proposalId: string) {
  const {
    data: { votes }
  }: { data: { votes: Vote[] } } = await client.query({
    query: VOTE_QUERY,
    variables: {
      voter,
      proposalId
    }
  });

  return votes[0];
}

export async function fetchSpace(id: string) {
  const {
    data: { space }
  }: { data: { space: Space | null } } = await client.query({
    query: SPACE_QUERY,
    variables: {
      id
    }
  });

  return space;
}
