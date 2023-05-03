import VotesReport from '../lib/votesReport';
import ogImage, { ImageType } from '../lib/ogImage';
import StorageEngine from '../lib/storage/file'; // aws | file
import type { Response } from 'express';

const ERROR_CODES: Record<string, number> = {
  'Invalid Request': -32600,
  PROPOSAL_NOT_FOUND: -40001,
  PROPOSAL_NOT_CLOSED: -40004,
  PENDING_GENERATION: -40010,
  UNAUTHORIZE: 401
};

export function rpcSuccess(res: Response, result: string, id: string | number) {
  res.json({
    jsonrpc: '2.0',
    result,
    id
  });
}

export function rpcError(res: Response, e: Error | string, id: string | number) {
  const errorMessage = e instanceof Error ? e.message : e;
  const errorCode = ERROR_CODES[errorMessage] ? ERROR_CODES[errorMessage] : -32603;

  res.status(errorCode > 0 ? errorCode : 500).json({
    jsonrpc: '2.0',
    error: {
      code: errorCode,
      message: errorMessage
    },
    id
  });
}

export async function sleep(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

export function voteReportWithStorage(id: string) {
  return new VotesReport(id, new StorageEngine('votes'));
}

export function ogImageWithStorage(type: ImageType, id: string) {
  return new ogImage(type, id, new StorageEngine('ogImages'));
}

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
