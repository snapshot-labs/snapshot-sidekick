import log from '../helpers/log';
import { sleep, voteReportWithStorage } from '../helpers/utils';

export const queues = new Set<string>();

async function process(id: string) {
  log.info(`[queue] Processing queue item: ${id}`);
  try {
    await voteReportWithStorage(id).generateCacheFile();
  } catch (e) {
    log.error(`[queue] Error while processing item`, e);
  } finally {
    queues.delete(id);
  }
}

async function run() {
  try {
    log.info(`[queue] Poll queue (found ${queues.size} items)`);
    queues.forEach(async item => process(item));
  } catch (e) {
    log.error(e);
  } finally {
    await sleep(15e3);
    await run();
  }
}

run();
