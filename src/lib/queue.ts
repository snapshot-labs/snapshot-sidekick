import { sleep } from '../helpers/utils';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { timeQueueProcess } from './metrics';
import type Cache from './cache';

const queues = new Map<string, Cache>();
const processingItems = new Map<string, Cache>();

async function processItem(cacheable: Cache) {
  console.log(`[queue] Processing queue item: ${cacheable}`);
  try {
    const end = timeQueueProcess.startTimer({ name: cacheable.constructor.name });
    processingItems.set(cacheable.id, cacheable);

    if (
      ['Summary', 'TextToSpeech'].includes(cacheable.constructor.name) &&
      !!(await cacheable.getCache())
    ) {
      return;
    }

    await cacheable.createCache();
    end();
  } catch (e) {
    capture(e, { id: cacheable.id });
    console.error(`[queue] Error while processing item`, e);
  } finally {
    queues.delete(cacheable.id);
    processingItems.delete(cacheable.id);
  }
}

export function queue(cacheable: Cache) {
  if (!queues.has(cacheable.id)) {
    queues.set(cacheable.id, cacheable);
  }

  return queues.size;
}

export function size() {
  return queues.size;
}

export function getProgress(id: string) {
  if (processingItems.has(id)) {
    return processingItems.get(id)?.generationProgress as number;
  }

  return 0;
}

async function run() {
  try {
    console.log(`[queue] Poll queue (found ${queues.size} items)`);
    queues.forEach(async (cacheable, id) => {
      if (processingItems.has(id)) {
        console.log(
          `[queue] Skip: ${cacheable} is currently being processed, progress:
          ${processingItems.get(id)?.generationProgress}%`
        );
        return;
      }

      processItem(cacheable);
    });
  } catch (e) {
    capture(e);
  } finally {
    await sleep(parseInt(process.env.QUEUE_INTERVAL || '15000'));
    await run();
  }
}

run();
