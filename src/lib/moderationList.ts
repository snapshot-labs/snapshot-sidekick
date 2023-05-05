import { readFileSync } from 'fs';
import path from 'path';

const FIELDS = ['flaggedLinks', 'flaggedProposalIds', 'verifiedSpaces'];

export function getModerationList(fields = FIELDS) {
  const result: Record<string, string[] | Record<string, number>> = {};

  return fields
    .filter(field => FIELDS.includes(field))
    .map(field => [field, JSON.parse(readFileSync(filePath(field), { encoding: 'utf8' }))])
    .reduce((hash, [name, value]) => {
      hash[name] = value;
      return hash;
    }, result);
}

export const filePath = (filename: string) => {
  return path.resolve(__dirname, `../../data/${filename}.json`);
};
