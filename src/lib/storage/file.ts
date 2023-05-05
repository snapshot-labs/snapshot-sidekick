import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import log from '../../helpers/log';
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

  async set(key: string, value: string | Buffer) {
    try {
      writeFileSync(this.#path(key), value);
      log.info(`[storage:file] File saved to ${this.#path(key)}`);

      return true;
    } catch (e) {
      log.error('[storage:file] Store file failed', e);
      throw e;
    }
  }

  async get(key: string) {
    try {
      if (!existsSync(this.#path(key))) {
        return false;
      }
      log.info(`[storage:file] File fetched from ${this.#path(key)}`);

      return readFileSync(this.#path(key));
    } catch (e) {
      log.error('[storage:file] Fetch file failed', e);
      return false;
    }
  }

  #path(key?: string) {
    return [CACHE_PATH, this.subDir?.replace(/^\/+|\/+$/, ''), key].filter(p => p).join('/');
  }
}

export default File;
