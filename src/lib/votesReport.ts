import { fetchProposal, fetchVotes } from '../helpers/snapshot';
import log from '../helpers/log';
import type { Proposal, Vote } from '../helpers/snapshot';
import type { IStorage } from './storage/types';

class VotesReport {
  id: string;
  filename: string;
  proposal?: Proposal | null;
  storage: IStorage;

  constructor(id: string, storage: IStorage) {
    this.id = id;
    this.filename = `snapshot-votes-report-${this.id}.csv`;
    this.storage = storage;
  }

  cachedFile = () => {
    return this.storage.get(this.filename);
  };

  canBeCached = async () => {
    this.proposal = await this.fetchProposal();

    if (!this.proposal) {
      return Promise.reject('PROPOSAL_NOT_FOUND');
    }

    if (this.proposal.state !== 'closed') {
      return Promise.reject('PROPOSAL_NOT_CLOSED');
    }

    return true;
  };

  generateCacheFile = async () => {
    await this.canBeCached();

    let votes: Vote[] = [];
    let page = 0;
    let createdPivot = 0;
    const pageSize = 1000;
    let resultsSize = 0;
    const maxPage = 5;
    let totalResults = 0;
    let headersAppended = false;
    let content = '';

    log.info(`[votereport] Generating cache file for ${this.id}`);

    do {
      let newVotes = await fetchVotes(this.id, {
        first: pageSize,
        skip: page * pageSize,
        created_gte: createdPivot,
        orderBy: 'created',
        orderDirection: 'asc'
      });
      resultsSize = newVotes.length;

      if (!headersAppended) {
        const headers = [
          'address',
          newVotes.length === 0 || typeof newVotes[0].choice === 'number'
            ? 'choice'
            : this.proposal?.choices.map((_choice, index) => `choice.${index + 1}`),
          'voting_power',
          'timestamp',
          'author_ipfs_hash',
          'reason'
        ].flat();

        content += headers.join(',');

        headersAppended = true;
      }

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

      content += `\n${newVotes.map(vote => this.#formatCsvLine(vote)).join('\n')}`;

      votes = newVotes;
      totalResults += newVotes.length;
    } while (resultsSize === pageSize);

    log.info(`[vote report] File cache ready to be saved with ${totalResults} items`);

    return this.storage.set(this.filename, content);
  };

  fetchProposal = async () => {
    return await fetchProposal(this.id);
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

    return [vote.voter, choices, vote.vp, vote.created, vote.ipfs, `"${vote.reason}"`]
      .flat()
      .join(',');
  };
}

export default VotesReport;
