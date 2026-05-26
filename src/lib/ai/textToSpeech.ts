import OpenAI from 'openai';
import removeMd from 'remove-markdown';
import { fetchProposal, Proposal } from '../../helpers/snapshot';
import Cache from '../cache';
import { IStorage } from '../storage/types';

const MIN_BODY_LENGTH = 1;
const MAX_BODY_LENGTH = 4096;

export default class TextToSpeech extends Cache {
  proposal?: Proposal | null;
  openAi: OpenAI;

  constructor(id: string, storage: IStorage) {
    super(id, storage);
    this.filename = `snapshot-proposal-ai-tts-${this.id}.mp3`;
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
    const body = removeMd(this.proposal!.body);

    if (body.length < MIN_BODY_LENGTH || body.length > MAX_BODY_LENGTH) {
      throw new Error('UNSUPPORTED_PROPOSAL');
    }

    try {
      const mp3 = await this.openAi.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: body
      });

      return Buffer.from(await mp3.arrayBuffer());
    } catch (err: any) {
      throw err.error?.code ? new Error(err.error?.code.toUpperCase()) : err;
    }
  };
}
