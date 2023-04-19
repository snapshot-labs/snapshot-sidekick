import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';

export type Proposal = {
  id: string;
  state: string;
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
  }: { data: { proposal: Proposal } } = await client.query({
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
