import { fetchAllVotes, fetchProposal, Proposal, Vote } from '../helpers/snapshot';
import type { IStorage } from './storage/types';
import Cache from './cache';

class VotesReport extends Cache {
  proposal?: Proposal | null;

  constructor(id: string, storage: IStorage) {
    super(id, storage);
    this.filename = `snapshot-votes-report-${this.id}.csv`;
  }

  async isCacheable() {
    this.proposal = await fetchProposal(this.id);

    if (!this.proposal) {
      return Promise.reject('ENTRY_NOT_FOUND');
    }

    if (this.proposal.state !== 'closed') {
      return Promise.reject('PROPOSAL_NOT_CLOSED');
    }

    return true;
  }

  getContent = async () => {
    this.isCacheable();
    const votes = await fetchAllVotes(this.id);
    let content = '';

    console.log(`[votes-report] Generating report for ${this.id}`);

    const headers = [
      'address',
      votes.length === 0 || typeof votes[0].choice === 'number'
        ? 'choice'
        : this.proposal && this.proposal.choices.map((_choice, index) => `choice.${index + 1}`),
      'voting_power',
      'timestamp',
      'author_ipfs_hash',
      'reason'
    ].flat();

    content += headers.join(',');
    content += `\n${votes.map(vote => this.#formatCsvLine(vote)).join('\n')}`;

    console.log(`[votes-report] Report for ${this.id} ready with ${votes.length} items`);

    return content;
  };

  toString() {
    return `VotesReport#${this.id}`;
  }

  #formatCsvLine = (vote: Vote) => {
    let choices: Vote['choice'][] = [];

    if (typeof vote.choice !== 'number' && this.proposal) {
      choices = Array.from({ length: this.proposal.choices.length });
      for (const [key, value] of Object.entries(vote.choice)) {
        choices[parseInt(key) - 1] = value;
      }
    } else {
      choices.push(vote.choice);
    }

    return [
      vote.voter,
      ...choices,
      vote.vp,
      vote.created,
      vote.ipfs,
      `"${vote.reason.replace(/(\r\n|\n|\r)/gm, '')}"`
    ]
      .flat()
      .join(',');
  };
}

export default VotesReport;
