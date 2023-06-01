import { readFileSync } from 'fs';
import path from 'path';
import db from '../helpers/mysql';

type MODERATION_LIST = Record<string, string[] | JSON>;

const CACHE_PATH = path.resolve(__dirname, `../../${process.env.MODERATION_LIST_PATH || 'data'}`);
const FIELDS = new Map<keyof MODERATION_LIST, Record<string, string>>([
  ['flaggedLinks', { action: 'flag', type: 'link' }],
  ['flaggedProposals', { action: 'flag', type: 'proposal' }],
  ['flaggedSpaces', { action: 'flag', type: 'space' }],
  ['verifiedSpaces', { action: 'verify', type: 'space' }],
  ['verifiedTokens', { file: 'verifiedTokens.json' }]
]);

export function readFile(filename: string) {
  return parseFileContent(
    readFileSync(path.join(CACHE_PATH, filename), { encoding: 'utf8' }),
    filename.split('.')[1]
  );
}

function parseFileContent(content: string, parser: string): MODERATION_LIST[keyof MODERATION_LIST] {
  switch (parser) {
    case 'txt':
      return content.split('\n').filter(value => value !== '');
    case 'json':
      return JSON.parse(content);
    default:
      throw new Error('Invalid file type');
  }
}

export default async function getModerationList(fields = Array.from(FIELDS.keys())) {
  const list: Partial<MODERATION_LIST> = {};
  const reverseMapping: Record<string, keyof MODERATION_LIST> = {};
  const queryWhereStatement: string[] = [];
  let queryWhereArgs: string[] = [];

  fields.forEach(field => {
    if (FIELDS.has(field)) {
      const args = FIELDS.get(field) as Record<string, string>;

      if (!args.file) {
        list[field] = [];
        reverseMapping[`${args.action}-${args.type}`] = field;

        queryWhereStatement.push(`(action = ? AND type = ?)`);
        queryWhereArgs = queryWhereArgs.concat([args.action, args.type]);
      } else {
        list[field] = readFile(args.file);
      }
    }
  });

  const dbResults = await db.queryAsync(
    `SELECT * FROM moderation WHERE ${queryWhereStatement.join(' OR ')}`,
    queryWhereArgs
  );

  dbResults.forEach(row => {
    (list[reverseMapping[`${row.action}-${row.type}`]] as string[]).push(row.value as string);
  });

  return list;
}
