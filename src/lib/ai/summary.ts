import OpenAI from 'openai';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { fetchProposal, Proposal } from '../../helpers/snapshot';
import { IStorage } from '../storage/types';
import Cache from '../cache';

const openai = new OpenAI({ apiKey: process.env.apiKey });

class Summary extends Cache {
  proposal?: Proposal | null;

  constructor(id: string, storage: IStorage) {
    super(id, storage);
    this.filename = `snapshot-proposal-ai-summary-${this.id}.txt`;
  }

  async isCacheable() {
    this.proposal = await fetchProposal(this.id);

    if (!this.proposal) {
      return Promise.reject('RECORD_NOT_FOUND');
    }

    return true;
  }

  getContent = async () => {
    this.isCacheable();

    try {
      const { body, title, space } = this.proposal!;

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `The following is a governance proposal of ${space.name}. Generate me a summary in 300 characters max. Here's the title of the proposal: '${title}' . Here's the content of the proposal: '${body}'`
          }
        ],
        model: 'gpt-4-turbo-preview'
      });

      if (completion.choices.length === 0) {
        throw new Error('No completion in response');
      }
      const content = completion.choices[0].message.content;

      if (!content) {
        throw new Error('No content in response');
      }

      return content;
    } catch (e: any) {
      capture(e);
      throw e;
    }
  };
}

export default Summary;
