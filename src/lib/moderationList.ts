import { readFileSync, readdirSync } from 'fs';
import path from 'path';

type LIST = string[] | JSON;
type MODERATION_LIST = Record<string, LIST>;

const FIELDS = [
  'flaggedLinks',
  'flaggedProposals',
  'verifiedSpaces',
  'flaggedSpaces',
  'verifiedTokens'
];
const FILE_TYPES = ['json', 'txt'];
const CACHE_PATH = path.resolve(__dirname, `../../${process.env.MODERATION_LIST_PATH || 'data'}`);

const files: MODERATION_LIST = {};

function parseFileContent(content: string, parser: string): LIST {
  switch (parser) {
    case 'txt':
      return content.split('\n').filter(value => value !== '');
    case 'json':
      return JSON.parse(content);
    default:
      throw new Error('Invalid file type');
  }
}

function initFiles() {
  readdirSync(CACHE_PATH).map(fn => {
    const [filename, ext] = fn.split('.');
    if (FILE_TYPES.includes(ext) && FIELDS.includes(filename)) {
      files[filename] = parseFileContent(
        readFileSync(path.join(CACHE_PATH, fn), { encoding: 'utf8' }),
        ext
      );
    }
  });
}

export default function getModerationList(fields = FIELDS) {
  if (Object.keys(files).length === 0) {
    initFiles();
  }

  const result: MODERATION_LIST = {};
  fields.forEach(field => FIELDS.includes(field) && (result[field] = files[field]));

  return result;
}
