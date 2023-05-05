import { makeBadge } from 'badge-maker';
import { fetchSpace, fetchProposal, fetchProposals, Space, Proposal } from '../helpers/snapshot';
import type { Request } from 'express';

type State = 'pending' | 'active' | 'closed';
export type BadgeType = 'space' | 'proposal';
const STATE_COLORS: Record<State, string> = {
  pending: 'rgb(107, 114, 128)',
  active: 'yellowgreen',
  closed: '#384aff'
};

export async function getBadge(type: BadgeType, id: string, query: Request['query']) {
  switch (type) {
    case 'space':
      return await getSpaceBadge(id, query);
      break;
    case 'proposal':
      return await getProposalBadge(id);
      break;
    default:
      throw new Error('Invalid badge type');
  }
}

async function getSpaceBadge(id: string, query: Request['query']) {
  const space = await fetchSpace(id);

  if (!space) {
    throw new Error('Space not found');
  }

  if (query.field === 'followersCount') {
    return getSpaceFollowersCountBadge(space);
  } else {
    return await getSpaceProposalsCountBadge(space, (query.state || 'active') as State);
  }
}

async function getProposalBadge(id: string) {
  const proposal = await fetchProposal(id);

  if (!proposal) {
    throw new Error('PROPOSAL_NOT_FOUND');
  }

  return getProposalVotesCountBadge(proposal);
}

function getSpaceFollowersCountBadge(space: Space) {
  const format = {
    label: 'members',
    message: space.followersCount?.toLocaleString('en-US').toString() || '0',
    color: STATE_COLORS.active
  };

  return makeBadge(format);
}

async function getSpaceProposalsCountBadge(space: Space, state: State) {
  const proposals = await fetchProposals(space.id, state);

  const format = {
    label: 'proposals',
    message: proposals?.length.toLocaleString('en-US').toString() || '0',
    color: state ? STATE_COLORS[state] : STATE_COLORS.active
  };

  return makeBadge(format);
}

function getProposalVotesCountBadge(proposal: Proposal) {
  const format = {
    label: 'votes',
    message: proposal.votes.toLocaleString('en-US').toString() || '0',
    color: STATE_COLORS.active
  };

  return makeBadge(format);
}
