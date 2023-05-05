import log from '../helpers/log';
import { sleep, storageEngine } from '../helpers/utils';
import VotesReport from './votesReport';

export const queues = new Set<string>();

async function processItem(id: string) {
  log.info(`[queue] Processing queue item: ${id}`);
  try {
    await new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR)).generateCacheFile();
  } catch (e) {
    log.error(`[queue] Error while processing item`, e);
  } finally {
    queues.delete(id);
  }
}

async function run() {
  try {
    log.info(`[queue] Poll queue (found ${queues.size} items)`);
    queues.forEach(async item => processItem(item));
  } catch (e) {
    log.error(e);
  } finally {
    await sleep(15e3);
    await run();
  }
}

run();
