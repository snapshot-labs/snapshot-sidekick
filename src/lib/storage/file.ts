import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import log from '../../helpers/log';
import type { IStorage } from './types';

const CACHE_PATH = `${__dirname}/../../../tmp`;

class File implements IStorage {
  folder: string;

  constructor(folder: string) {
    this.folder = folder;

    if (!existsSync(`${CACHE_PATH}/${this.folder}`)) {
      mkdirSync(`${CACHE_PATH}/${this.folder}`);
    }
  }

  set = async (key: string, value: string) => {
    try {
      appendFileSync(this.path(key), value);
      log.info(`[storage:file] File saved to ${this.path(key)}`);

      return true;
    } catch (e) {
      log.error('[storage:file] Create file failed', e);
      throw e;
    }
  };

  get = async (key: string) => {
    try {
      return readFileSync(this.path(key), 'utf8');
    } catch (e) {
      log.error('[storage:file] Store file failed', e);
      return false;
    }
  };

  path = (key: string) => {
    return `${CACHE_PATH}/${this.folder}/${key}`;
  };
}

export default File;
