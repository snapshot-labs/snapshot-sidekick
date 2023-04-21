import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import type { IStorage } from './types';

const CACHE_PATH = `${__dirname}/../../../tmp`;

class File implements IStorage {
  constructor() {
    if (!existsSync(CACHE_PATH)) {
      mkdirSync(CACHE_PATH);
    }
  }

  set = async (key: string, value: string) => {
    return await appendFileSync(this.path(key), value);
  };

  get = async (key: string) => {
    return await readFileSync(this.path(key), 'utf8');
  };

  path = (key: string) => {
    return `${CACHE_PATH}/${key}`;
  };
}

export default File;
