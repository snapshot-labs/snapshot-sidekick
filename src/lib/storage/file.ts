import { writeFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import { capture } from '../../helpers/sentry';
import type { IStorage } from './types';

const CACHE_PATH = `${__dirname}/../../../tmp`;

class File implements IStorage {
  subDir?: string;

  constructor(subDir?: string) {
    this.subDir = subDir;

    if (!existsSync(this.path())) {
      mkdirSync(this.path(), { recursive: true });
    }
  }

  async set(key: string, value: string | Buffer) {
    try {
      writeFileSync(this.path(key), value);
      console.log(`[storage:file] File saved to ${this.path(key)}`);

      return true;
    } catch (e) {
      capture(e);
      console.error('[storage:file] File storage failed', e);
      throw e;
    }
  }

  async get(key: string) {
    try {
      if (!existsSync(this.path(key))) {
        return false;
      }

      console.log(`[storage:file] File fetched from ${this.path(key)}`);
      return readFileSync(this.path(key));
    } catch (e) {
      capture(e);
      console.error('[storage:file] Fetch file failed', e);
      return false;
    }
  }

  async delete(key: string) {
    try {
      if (!existsSync(this.path(key))) {
        return true;
      }

      rmSync(this.path(key));

      console.log(`[storage:file] File ${this.path(key)} deleted`);
      return true;
    } catch (e) {
      capture(e);
      console.error('[storage:file] Fetch deletion failed', e);
      return false;
    }
  }

  path(key?: string) {
    return [CACHE_PATH, this.subDir?.replace(/^\/+|\/+$/, ''), key].filter(p => p).join('/');
  }
}

export default File;
