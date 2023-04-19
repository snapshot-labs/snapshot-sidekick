import { existsSync, appendFileSync } from 'fs';
import { fetchProposal, fetchVotes } from './snapshot';
import type { Proposal, Vote } from './snapshot';

const CACHE_PATH = `${__dirname}/../../cache`;

class VotesReport {
  id: string;
  path: string;

  constructor(id: string) {
    this.id = id;
    this.path = `${CACHE_PATH}/snapshot-votes-report-${this.id}.csv`;
  }

  cachedFile = () => {
    return existsSync(this.path) && this.path;
  };

  generate = async () => {
    const proposal = await fetchProposal(this.id);

    if (!proposal) {
      return Promise.reject('PROPOSAL_NOT_FOUND');
    }

    if (proposal.state !== 'closed') {
      return Promise.reject('PROPOSAL_NOT_CLOSED');
    }

    if (!this.cachedFile()) {
      this.#generateCachedFile(proposal);
    }

    return Promise.resolve();
  };

  #generateCachedFile = (proposal: Proposal) => {
    const headers = [
      'address',
      'choice',
      // ...proposal.choices.map((choice, index) => `choice.${index + 1}`),
      'voting_power',
      'timestamp',
      'date_utc',
      'author_ipfs_hash'
    ];

    appendFileSync(this.path, headers.join(','));

    return this.#saveVotes();
  };

  #saveVotes = async () => {
    let votes: Vote[] = [];
    let page = 0;
    let createdPivot = 0;
    const pageSize = 1000;
    let resultsSize = 0;
    const maxPage = 5;

    do {
      let newVotes = await fetchVotes(this.id, {
        first: pageSize,
        skip: page * pageSize,
        created_gte: createdPivot,
        orderBy: 'created',
        orderDirection: 'asc'
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

      appendFileSync(this.path, `\n${newVotes.map(vote => this.#formatCsvLine(vote)).join('\n')}`);

      votes = newVotes;
    } while (resultsSize === pageSize);

    return this.path;
  };

  #formatCsvLine = (vote: Vote) => {
    return [
      vote.voter,
      vote.choice,
      vote.vp,
      vote.created,
      `"${new Date(vote.created * 1e3).toUTCString()}"`,
      vote.ipfs
    ].join(',');
  };
}

export default VotesReport;
