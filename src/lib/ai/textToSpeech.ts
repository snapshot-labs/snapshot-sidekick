import OpenAI from 'openai';
import { capture } from '@snapshot-labs/snapshot-sentry';
import removeMd from 'remove-markdown';
import Cache from '../cache';
import { fetchProposal, Proposal } from '../../helpers/snapshot';
import { IStorage } from '../storage/types';

const openai = new OpenAI({ apiKey: process.env.apiKey });
const MIN_BODY_LENGTH = 500;
const MAX_BODY_LENGTH = 4096;

export default class TextToSpeech extends Cache {
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
    const body = removeMd(this.proposal!.body);

    if (body.length < MIN_BODY_LENGTH || body.length > MAX_BODY_LENGTH) {
      throw new Error('UNSUPPORTED_PROPOSAL');
    }

    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: body
      });

      return Buffer.from(await mp3.arrayBuffer());
    } catch (e: any) {
      capture(e);
      throw e;
    }
  };
}
