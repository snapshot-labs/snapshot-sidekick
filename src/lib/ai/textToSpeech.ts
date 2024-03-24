import OpenAI from 'openai';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { fetchProposal, Proposal } from '../../helpers/snapshot';
import { IStorage } from '../storage/types';
import Cache from '../cache';

const openai = new OpenAI({ apiKey: process.env.apiKey });

class TextToSpeech extends Cache {
  proposal?: Proposal | null;

  constructor(id: string, storage: IStorage) {
    super(id, storage);
    this.filename = `snapshot-proposal-ai-tts-${this.id}.mp3`;
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

    if (this.proposal!.body.length > 4096 || this.proposal!.body.length < 500) {
      throw new Error('UNSUPPORTED_PROPOSAL');
    }

    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: this.proposal!.body
      });

      return Buffer.from(await mp3.arrayBuffer());
    } catch (e: any) {
      capture(e);
      throw e;
    }
  };
}

export default TextToSpeech;
