import { sleep, storageEngine } from '../helpers/utils';
import VotesReport from './votesReport';

export const queues = new Set<string>();

async function processItem(id: string) {
  console.log(`[queue] Processing queue item: ${id}`);
  try {
    await new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR)).generateCacheFile();
  } catch (e) {
    console.error(`[queue] Error while processing item`, e);
  } finally {
    queues.delete(id);
  }
}

async function run() {
  try {
    console.log(`[queue] Poll queue (found ${queues.size} items)`);
    queues.forEach(async item => processItem(item));
  } catch (e) {
    console.error(e);
  } finally {
    await sleep(15e3);
    await run();
  }
}

run();
