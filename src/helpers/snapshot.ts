import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';

export type Space = {
  id: string;
  name: string;
  about?: string;
  followersCount?: number;
};
export type Proposal = {
  id: string;
  state: string;
  votes: number;
  choices: string[];
};
export type Vote = {
  ipfs: string;
  voter: string;
  choice: Record<string, number> | number;
  vp: number;
  reason: string;
  created: number;
};

const client = new ApolloClient({
  link: new HttpLink({ uri: `${process.env.HUB_URL}/graphql` }),
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
    }
  }
`;

const SPACE_PROPOSALS_QUERY = gql`
  query Proposals($id: String!, $state: String) {
    proposals(where: { space: $id, state: $state }) {
      id
    }
  }
`;

const SPACE_QUERY = gql`
  query Space($id: String) {
    space(id: $id) {
      id
      name
      about
      followersCount
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

export async function fetchProposals(id: string, state?: string) {
  const {
    data: { proposals }
  }: { data: { proposals: Proposal[] } } = await client.query({
    query: SPACE_PROPOSALS_QUERY,
    variables: {
      id,
      state
    }
  });

  return proposals;
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
