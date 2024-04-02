import { sleep } from '../helpers/utils';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { timeQueueProcess } from './metrics';
import type Cache from './cache';

const queues = new Map<string, Cache>();
const processingItems = new Map<string, Cache>();

async function processItem(cacheable: Cache) {
  console.log(`[queue] Processing queue item: ${cacheable}`);
  try {
    if (
      ['Summary', 'TextToSpeech'].includes(cacheable.constructor.name) &&
      !(await cacheable.getCache())
    ) {
      return;
    }

    const end = timeQueueProcess.startTimer({ name: cacheable.constructor.name });
    processingItems.set(cacheable.toString(), cacheable);

    await cacheable.createCache();
    end();
  } catch (e) {
    capture(e, { id: cacheable.toString() });
    console.error(`[queue] Error while processing item`, e);
  } finally {
    queues.delete(cacheable.toString());
    processingItems.delete(cacheable.toString());
  }
}

export function queue(cacheable: Cache) {
  if (!queues.has(cacheable.toString())) {
    queues.set(cacheable.toString(), cacheable);
  }

  return queues.size;
}

export function size() {
  return queues.size;
}

export function getProgress(id: string) {
  if (processingItems.has(id.toString())) {
    return processingItems.get(id.toString())?.generationProgress as number;
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
