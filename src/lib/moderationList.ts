import { readFileSync } from 'fs';
import path from 'path';

const FIELDS = ['flaggedLinks', 'flaggedProposals', 'verifiedSpaces'];
const CACHE_PATH = path.resolve(__dirname, `../../${process.env.MODERATION_LIST_PATH || 'data'}`);

export default function getModerationList(fields = FIELDS) {
  const result: Record<string, string[] | Record<string, number>> = {};

  return fields
    .filter(field => FIELDS.includes(field))
    .map(field => [field, JSON.parse(readFileSync(filePath(field), { encoding: 'utf8' }))])
    .reduce((hash, [name, value]) => {
      hash[name] = value;
      return hash;
    }, result);
}

const filePath = (filename: string) => {
  return path.join(CACHE_PATH, `${filename}.json`);
};
