import { fetchAllVotes, fetchProposal } from '../helpers/snapshot';
import type { Proposal, Vote } from '../helpers/snapshot';
import type { IStorage } from './storage/types';

class VotesReport {
  id: string;
  filename: string;
  proposal?: Proposal | null;
  storage: IStorage;
  generationProgress: number;

  constructor(id: string, storage: IStorage) {
    this.id = id;
    this.filename = `snapshot-votes-report-${this.id}.csv`;
    this.storage = storage;
    this.generationProgress = 0;
  }

  cachedFile = () => {
    return this.storage.get(this.filename);
  };

  canBeCached = async () => {
    this.proposal = await this.fetchProposal();

    if (!this.proposal) {
      return Promise.reject('RECORD_NOT_FOUND');
    }

    if (this.proposal.state !== 'closed') {
      return Promise.reject('RECORD_NOT_FOUND');
    }

    return true;
  };

  generateCacheFile = async () => {
    await this.canBeCached();

    const votes = await this.fetchAllVotes();
    const totalResults = 0;
    let content = '';

    console.log(`[votes-report] Generating cache file for ${this.id}`);

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

    console.log(`[votes-report] File cache ready to be saved with ${totalResults} items`);

    return this.storage.set(this.filename, content);
  };

  fetchProposal = async () => {
    return fetchProposal(this.id);
  };

  fetchAllVotes = async () => {
    return fetchAllVotes(this.id);
  };

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
      choices,
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
