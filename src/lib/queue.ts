import { sleep, storageEngine } from '../helpers/utils';
import VotesReport from './votesReport';

const queues = new Set<string>();
const processingItems = new Map<string, VotesReport>();

async function processItem(id: string) {
  console.log(`[queue] Processing queue item: ${id}`);
  try {
    const voteReport = new VotesReport(id, storageEngine(process.env.VOTE_REPORT_SUBDIR));
    processingItems.set(id, voteReport);
    await voteReport.generateCacheFile();
  } catch (e) {
    console.error(`[queue] Error while processing item`, e);
  } finally {
    queues.delete(id);
    processingItems.delete(id);
  }
}

export function queue(id: string) {
  queues.add(id);
}

async function run() {
  try {
    console.log(`[queue] Poll queue (found ${queues.size} items)`);
    queues.forEach(async item => {
      if (processingItems.has(item)) {
        console.log(
          `[queue] Skip: ${item} is currently being processed, progress: ${
            processingItems.get(item)?.generationProgress
          }%`
        );
        return;
      }

      processItem(item);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await sleep(15e3);
    await run();
  }
}

run();
