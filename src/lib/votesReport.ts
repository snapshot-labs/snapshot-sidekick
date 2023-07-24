import { fetchProposal, fetchVotes, Proposal, Vote } from '../helpers/snapshot';
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

    if (!this.proposal || this.proposal.state !== 'closed') {
      return Promise.reject('RECORD_NOT_FOUND');
    }

    return true;
  }

  getContent = async () => {
    this.isCacheable();
    const votes = await this.fetchAllVotes();

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

  fetchAllVotes = async () => {
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

      votes = votes.concat(newVotes);

      this.generationProgress = Number(
        ((votes.length / (this.proposal?.votes as number)) * 100).toFixed(2)
      );
    } while (resultsSize === pageSize);

    return votes;
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
