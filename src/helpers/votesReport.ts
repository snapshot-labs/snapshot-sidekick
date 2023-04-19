import { existsSync, appendFileSync, renameSync } from 'fs';
import { fetchProposal, fetchVotes } from './snapshot';
import type { Proposal, Vote } from './snapshot';

const CACHE_PATH = `${__dirname}/../../cache`;

class VotesReport {
  id: string;
  path: string;
  tempPath: string;
  proposal?: Proposal;

  constructor(id: string) {
    this.id = id;
    this.path = `${CACHE_PATH}/snapshot-votes-report-${this.id}.csv`;
    this.tempPath = `${this.path}.pending`;
  }

  cachedFile = () => {
    return existsSync(this.path) && this.path;
  };

  generate = async () => {
    if (existsSync(this.tempPath)) {
      return Promise.reject('PENDING_GENERATION');
    }

    this.proposal = await fetchProposal(this.id);

    if (!this.proposal) {
      return Promise.reject('PROPOSAL_NOT_FOUND');
    }

    if (this.proposal.state !== 'closed') {
      return Promise.reject('PROPOSAL_NOT_CLOSED');
    }

    if (!this.cachedFile()) {
      this.#generateCachedFile();
    }

    return Promise.resolve();
  };

  #generateCachedFile = () => {
    // Touch file to prevent race condition allowing file generation
    // to be run multiple times
    appendFileSync(this.tempPath, '');
    return this.#saveVotes();
  };

  #saveVotes = async () => {
    let votes: Vote[] = [];
    let page = 0;
    let createdPivot = 0;
    const pageSize = 1000;
    let resultsSize = 0;
    const maxPage = 5;
    let headersAppended = false;

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
            : this.proposal && this.proposal.choices.map((_choice, index) => `choice.${index + 1}`),
          'voting_power',
          'timestamp',
          'author_ipfs_hash'
        ].flat();

        appendFileSync(this.tempPath, headers.join(','));

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

      appendFileSync(
        this.tempPath,
        `\n${newVotes.map(vote => this.#formatCsvLine(vote)).join('\n')}`
      );

      votes = newVotes;
    } while (resultsSize === pageSize);

    renameSync(this.tempPath, this.path);

    return this.path;
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

    return [vote.voter, choices, vote.vp, vote.created, vote.ipfs].flat().join(',');
  };
}

export default VotesReport;
