import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'fs';
import type { IStorage } from './types';

const CACHE_PATH = `${__dirname}/../../../tmp`;

class File implements IStorage {
  subDir?: string;

  constructor(subDir?: string) {
    this.subDir = subDir;

    if (!existsSync(this.#path())) {
      mkdirSync(this.#path(), { recursive: true });
    }
  }

  clearAll(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async set(key: string, value: string) {
    try {
      writeFileSync(this.#path(key), value);
      console.log(`[storage:file] File saved to ${this.#path(key)}`);

      return true;
    } catch (e) {
      console.error('[storage:file] File storage failed', e);
      throw e;
    }
  }

  async get(key: string) {
    try {
      if (!existsSync(this.#path(key))) {
        return false;
      }

      return readFileSync(this.#path(key), 'utf8');
    } catch (e) {
      console.error('[storage:file] Fetch file failed', e);
      return false;
    }
  }

  async delete(key: string) {
    try {
      return rmSync(this.#path(key));
    } catch (e) {
      console.error('[storage:file] Fetch delete failed', e);
      return false;
    }
  }

  async list() {
    try {
      return readdirSync(this.#path());
    } catch (e) {
      console.error('[storage:file] List failed', e);
      return [];
    }
  }

  async clear() {
    const items = await this.list();

    items.map(item => {
      this.delete(item);
    });

    return true;
  }

  #path(key?: string) {
    return [CACHE_PATH, this.subDir?.replace(/^\/+|\/+$/, ''), key].filter(p => p).join('/');
  }
}

export default File;
