import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import log from '../../helpers/log';
import type { IStorage } from './types';

const CACHE_PATH = `${__dirname}/../../../tmp`;

class File implements IStorage {
  folder: string;

  constructor(folder: string) {
    this.folder = folder;

    if (!existsSync(`${CACHE_PATH}/${this.folder}`)) {
      mkdirSync(`${CACHE_PATH}/${this.folder}`, { recursive: true });
    }
  }

  set = async (key: string, value: string | Buffer) => {
    try {
      writeFileSync(this.path(key), value);
      log.info(`[storage:file] File saved to ${this.path(key)}`);

      return true;
    } catch (e) {
      log.error('[storage:file] Create file failed', e);
      throw e;
    }
  };

  get = async (key: string) => {
    try {
      if (!existsSync(this.path(key))) {
        return false;
      }

      return readFileSync(this.path(key));
    } catch (e) {
      log.error('[storage:file] Fetch file failed', e);
      return false;
    }
  };

  path = (key: string) => {
    return `${CACHE_PATH}/${this.folder}/${key}`;
  };
}

export default File;
