import { fetchProposal } from '../../helpers/snapshot';

export default async function metadata(proposal_id: string) {
  const proposal = await fetchProposal(proposal_id);

  if (!proposal) {
    return Promise.reject('RECORD_NOT_FOUND');
  }

  return {
    name: proposal?.title,
    image: `${process.env.SNAPIT_URL}/picsnap/snapit/${proposal.id}.png`,
    properties: {
      space: proposal.space.id,
      author: proposal.author,
      state: proposal.state,
      votes: proposal.votes,
      choices: proposal.choices,
      start: new Date(proposal.start * 1e3),
      end: new Date(proposal.end * 1e3)
    }
  };
}
