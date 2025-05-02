import { capture } from '@snapshot-labs/snapshot-sentry';
import VotesReport from './votesReport';
import { sleep, storageEngine } from '../helpers/utils';
import { queue } from './queue';

const REFRESH_INTERVAL = 15 * 60 * 1e3;
const INDEX_FILENAME = 'snapshot-active-proposals-list.csv';
const storage = storageEngine(process.env.VOTE_REPORT_SUBDIR);

async function processItems(): Promise<number> {
  const list = await getIndex();

  list.forEach((id: string) => queue(new VotesReport(id, storage)));

  return list.length;
}

export async function getIndex(): Promise<string[]> {
  const cachedList = await storage.get(INDEX_FILENAME);
  return cachedList ? JSON.parse(cachedList.toString()) : [];
}

export async function setIndex(list: string[]) {
  return storage.set(INDEX_FILENAME, JSON.stringify(list));
}

export default async function run() {
  try {
    console.log(`[cache-refresh] Refreshing active proposals cache`);
    const count = await processItems();
    console.log(`[cache-refresh] ${count} proposals queued for refresh`);
  } catch (e) {
    capture(e);
  } finally {
    await sleep(REFRESH_INTERVAL);
    await run();
  }
}
