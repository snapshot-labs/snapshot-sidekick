import OpenAI from 'openai';
import { fetchProposal, Proposal } from '../../helpers/snapshot';
import Cache from '../cache';
import { IStorage } from '../storage/types';

class Summary extends Cache {
  proposal?: Proposal | null;
  openAi: OpenAI;

  constructor(id: string, storage: IStorage) {
    super(id, storage);
    this.filename = `snapshot-proposal-ai-summary-${this.id}.txt`;
    this.openAi = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'Missing key'
    });
  }

  async isCacheable() {
    this.proposal = await fetchProposal(this.id);

    if (!this.proposal) {
      throw new Error('RECORD_NOT_FOUND');
    }

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
            content: `The following is a governance proposal of '${space.name}'. Generate me a summary in 350 characters max. Here's the title of the proposal: '${title}'. Here's the content of the proposal: '${body}'. Do not repeat the title. Do not format the answer (no markdown, no HTML).`
          }
        ],
        model: 'gpt-4o'
      });

      if (completion.choices.length === 0) {
        throw new Error('EMPTY_OPENAI_CHOICES');
      }
      const content = completion.choices[0].message.content;

      if (!content) {
        throw new Error('EMPTY_OPENAI_RESPONSE');
      }

      return content;
    } catch (err: any) {
      throw err.error?.code ? new Error(err.error?.code.toUpperCase()) : err;
    }
  };
}

export default Summary;
