import { IStorage } from './storage/types';

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

  async getContent() {
    return '';
  }

  getCache() {
    return this.storage.get(this.filename);
  }

  async isCacheable() {
    return true;
  }

  async createCache() {
    await this.isCacheable();
    const content = await this.getContent();

    console.log(`[votes-report] File cache ready to be saved`);

    this.storage.set(this.filename, content);
  }
}
