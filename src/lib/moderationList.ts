import { readFileSync } from 'fs';
import path from 'path';

const FIELDS = [
  'flaggedLinks',
  'flaggedProposals',
  'verifiedSpaces',
  'flaggedSpaces',
  'verifiedTokens'
];
const CACHE_PATH = path.resolve(__dirname, `../../${process.env.MODERATION_LIST_PATH || 'data'}`);

export default function getModerationList(fields = FIELDS) {
  const result: Record<string, string[] | Record<string, number>> = {};
  fields.forEach(field => {
    if (FIELDS.includes(field)) {
      result[field] = JSON.parse(readFileSync(filePath(field), { encoding: 'utf8' }));
    }
  });

  return result;
}

const filePath = (filename: string) => {
  return path.join(CACHE_PATH, `${filename}.json`);
};
