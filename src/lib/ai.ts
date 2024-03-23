import OpenAI from 'openai';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { fetchProposal, Proposal } from '../helpers/snapshot';
import { IStorage } from './storage/types';
import Cache from './cache';

const openai = new OpenAI({ apiKey: process.env.apiKey });

class AISummary extends Cache {
  proposal?: Proposal | null;

  constructor(id: string, storage: IStorage) {
    super(id, storage);
    this.filename = `snapshot-votes-report-${this.id}.csv`;
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
      const proposal = await fetchProposal(this.id);
      const body = proposal?.body;
      const title = proposal?.title;
      const spaceName = proposal?.space?.name;
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `The following is a governance proposal of ${spaceName}. Generate me a summary in 300 characters max. Here's the title of the proposal: '${title}' . Here's the content of the proposal: '${body}'`
          }
        ],
        model: 'gpt-4-turbo-preview'
      });

      if (completion.choices.length === 0) {
        throw new Error('No completion in response');
      }
      const res = completion?.choices[0];

      if (res.message.content === null) {
        throw new Error('No content in response');
      }

      const content = res.message?.content;
      return content;
    } catch (e: any) {
      capture(e);
      throw e;
    }
  };
}

export default AISummary;
