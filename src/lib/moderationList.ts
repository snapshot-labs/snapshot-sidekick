import { readFileSync } from 'fs';
import path from 'path';

const FIELDS = ['flaggedLinks', 'flaggedProposalIds', 'verifiedSpaces'];

export default function moderationList(fields = FIELDS) {
  const result: Record<string, string[] | Record<string, number>> = {};

  return fields
    .filter(field => FIELDS.includes(field))
    .map(field => [
      field,
      JSON.parse(
        readFileSync(path.resolve(__dirname, `../../data/${field}.json`), { encoding: 'utf8' })
      )
    ])
    .reduce((hash, [name, value]) => {
      hash[name] = value;
      return hash;
    }, result);
}
