import log from '../helpers/log';
import { sleep, storageEngine } from '../helpers/utils';
import VotesReport from './votesReport';

export const queues = new Set<string>();
const processingItems = new Set<string>();

async function processItem(id: string) {
  log.info(`[queue] Processing queue item: ${id}`);
  try {
    processingItems.add(id);
    await new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR)).generateCacheFile();
  } catch (e) {
    log.error(`[queue] Error while processing item`, e);
  } finally {
    queues.delete(id);
    processingItems.delete(id);
  }
}

async function run() {
  try {
    log.info(`[queue] Poll queue (found ${queues.size} items)`);
    queues.forEach(async item => {
      if (processingItems.has(item)) {
        console.log(`[queue] Skip: ${item} is currently being processed`);
        return;
      }

      processItem(item);
    });
  } catch (e) {
    log.error(e);
  } finally {
    await sleep(15e3);
    await run();
  }
}

run();
