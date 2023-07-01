import {
  gql,
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import fetch from 'cross-fetch';

export type Proposal = {
  id: string;
  title: string;
  state: string;
  choices: string[];
  space: Space;
  votes: number;
  author: string;
};

export type Vote = {
  ipfs: string;
  voter: string;
  choice: Record<string, number> | number;
  vp: number;
  reason: string;
  created: number;
};

export type NftClaimer = {
  maxSupply: number;
  mintPrice: number;
  proposerCut: number;
  address: string;
  network: string;
  enabled: boolean;
};

export type Space = {
  id: string;
  name: string;
  about?: string;
  network: string;
  followersCount?: number;
  nftClaimer?: NftClaimer;
};

const httpLink = createHttpLink({
  uri: `${process.env.HUB_URL || 'https://hub.snapshot.org'}/graphql`,
  fetch,
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
      ...apiHeaders,
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    addTypename: false,
  }),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
  },
});

const PROPOSAL_QUERY = gql`
  query Proposal($id: String) {
    proposal(id: $id) {
      id
      title
      state
      choices
      votes
      author
      space {
        id
        network
      }
    }
  }
`;

const SPACE_QUERY = gql`
  query Space($id: String) {
    space(id: $id) {
      id
      name
      about
      network
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
    data: { proposal },
  }: { data: { proposal: Proposal | null } } = await client.query({
    query: PROPOSAL_QUERY,
    variables: {
      id,
    },
  });

  return proposal;
}

export async function fetchVotes(
  id: string,
  {
    first = 1000,
    skip = 0,
    orderBy = 'created_gte',
    orderDirection = 'asc',
    created_gte = 0,
  } = {}
) {
  const {
    data: { votes },
  }: { data: { votes: Vote[] } } = await client.query({
    query: VOTES_QUERY,
    variables: {
      id,
      orderBy,
      orderDirection,
      first,
      skip,
      created_gte,
    },
  });

  return votes;
}

export async function fetchAllVotes(id: string) {
  let votes: Vote[] = [];
  let page = 0;
  let createdPivot = 0;
  const pageSize = 1000;
  let resultsSize = 0;
  const maxPage = 5;

  do {
    let newVotes = await fetchVotes(id, {
      first: pageSize,
      skip: page * pageSize,
      created_gte: createdPivot,
      orderBy: 'created',
      orderDirection: 'asc',
    });
    resultsSize = newVotes.length;

    if (page === 0 && createdPivot > 0) {
      // Loosely assuming that there will never be more than 1000 duplicates
      const existingIpfs = votes.slice(-pageSize).map(vote => vote.ipfs);

      newVotes = newVotes.filter(vote => {
        return !existingIpfs.includes(vote.ipfs);
      });
    }

    if (page === maxPage) {
      page = 0;
      createdPivot = newVotes[newVotes.length - 1].created;
    } else {
      page++;
    }

    votes = votes.concat(newVotes);
  } while (resultsSize === pageSize);

  return votes;
}

export async function fetchSpace(id: string) {
  const {
    data: { space },
  }: { data: { space: Space | null } } = await client.query({
    query: SPACE_QUERY,
    variables: {
      id,
    },
  });

  return space;
}
