import OpenAI from 'openai';
import { fetchProposal, Proposal } from '../../helpers/snapshot';
import { IStorage } from '../storage/types';
import Cache from '../cache';

const tempCacheIds = new Map<string, number>();

class Summary extends Cache {
  proposal?: Proposal | null;
  openAi: OpenAI;

  constructor(id: string, storage: IStorage) {
    super(id, storage);
    this.filename = `snapshot-proposal-ai-summary-${this.id}.txt`;
    this.openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'Missing key' });
  }

  async isCacheable() {
    this.proposal = await fetchProposal(this.id);

    if (!this.proposal) throw new Error('RECORD_NOT_FOUND');
    if (this.#cacheExpired()) return false;

    return true;
  }

  getContent = async () => {
    this.isCacheable();

    try {
      const { body, title, space } = this.proposal!;

      const completion = await this.openAi.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `The following is a governance proposal of '${space.name}'. Generate me a summary in 350 characters max. Here's the title of the proposal: '${title}'. Here's the content of the proposal: '${body}'.`
          }
        ],
        model: 'gpt-4-turbo-preview'
      });

      if (completion.choices.length === 0) {
        throw new Error('EMPTY_OPENAI_CHOICES');
      }
      const content = completion.choices[0].message.content;

      if (!content) {
        throw new Error('EMPTY_OPENAI_RESPONSE');
      }

      return content;
    } catch (e: any) {
      throw e.error?.code ? new Error(e.error?.code.toUpperCase()) : e;
    }
  };

  #cacheExpired = () => {
    const { id, state, updated } = this.proposal!;

    if (state !== 'pending') return false;

    return tempCacheIds.has(id) && tempCacheIds.get(id) !== updated;
  };

  afterCreateCache() {
    tempCacheIds.set(this.proposal!.id, this.proposal!.updated);
  }
}

export default Summary;
