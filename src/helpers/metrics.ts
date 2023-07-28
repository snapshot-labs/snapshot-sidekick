import client from 'prom-client';
import promBundle from 'express-prom-bundle';
import type { Express } from 'express';
import { size as queueSize } from '../lib/queue';
import getModerationList from '../lib/moderationList';

export default function initMetrics(app: Express) {
  initCustomMetrics();

  app.use(
    promBundle({
      includeMethod: true,
      includePath: true,
      promClient: {
        collectDefaultMetrics: {}
      }
    })
  );
}

async function initCustomMetrics() {
  new client.Gauge({
    name: 'queue_size',
    help: 'Number of items in the cache queue',
    async collect() {
      this.set(queueSize());
    }
  });

  new client.Gauge({
    name: 'moderation_items_per_type_count',
    help: 'Number of items per moderation list',
    labelNames: ['type'],
    async collect() {
      const list = await getModerationList();
      for (const type in list) {
        const data = list[type] as any;
        this.set({ type }, Array.isArray(data) ? data.length : data.tokens.length);
      }
    }
  });
}
