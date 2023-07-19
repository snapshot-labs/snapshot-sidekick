import { fetchProposal } from '../../../../helpers/snapshot';
import template from './svg';

export default async function svg(proposalId: string) {
  const proposal = await fetchProposal(proposalId);

  if (!proposal) {
    throw new Error('ENTRY_NOT_FOUND');
  }

  return template(proposal);
}
