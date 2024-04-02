import { IStorage } from './storage/types';
import { cacheHitCount } from './metrics';

export default class Cache {
  id: string;
  filename: string;
  storage: IStorage;
  generationProgress: number;

  constructor(id: string, storage: IStorage) {
    this.id = id;
    this.filename = `${id}.cache`;
    this.storage = storage;
    this.generationProgress = 0;
  }

  async getContent(): Promise<string | Buffer> {
    return '';
  }

  async getCache() {
    const cache = await this.storage.get(this.filename);

    cacheHitCount.inc({ status: !cache ? 'MISS' : 'HIT', type: this.constructor.name });

    return cache;
  }

  async isCacheable() {
    return true;
  }

  afterCreateCache() {}

  async createCache() {
    await this.isCacheable();
    const content = await this.getContent();

    console.log(`[${this.constructor.name}] File cache ready to be saved`);

    this.storage.set(this.filename, content);
    this.afterCreateCache();

    return content;
  }

  toString() {
    return `${this.constructor.name}#${this.id}`;
  }
}
