import init from '@snapshot-labs/snapshot-metrics';
import { size as queueSize } from '../queue';
import getModerationList from '../moderationList';
import DigitalOcean from './digitalOcean';
import { capture } from '@snapshot-labs/snapshot-sentry';
import type { Express } from 'express';

export default function initMetrics(app: Express) {
  init(app, { customMetrics });
}

async function customMetrics(client: any) {
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

  try {
    const digitalOcean = new DigitalOcean();

    new client.Gauge({
      name: 'do_instances_per_app_count',
      help: 'Number of digital ocean instances per app',
      labelNames: ['name', 'tier', 'region', 'country', 'monthly_cost'],
      async collect() {
        const apps = await digitalOcean.apps();

        if (!apps) {
          return;
        }

        for (const name in apps) {
          const { instance_count, tier, region, country } = apps[name];
          this.set(
            {
              name,
              tier,
              region,
              country
            },
            instance_count
          );
        }
      }
    });

    new client.Gauge({
      name: 'do_app_cost',
      help: 'Monthly cost of each digital ocean app in USD',
      labelNames: ['name'],
      async collect() {
        const apps = await digitalOcean.apps();
        const instances = await digitalOcean.appInstances();

        if (!apps || !instances) {
          return;
        }

        for (const name in apps) {
          const instanceType = instances[apps[name].tier];
          this.set(
            {
              name
            },
            parseFloat(instanceType.usd_per_month) * apps[name].instance_count
          );
        }
      }
    });

    new client.Gauge({
      name: 'do_app_last_active_deploy_timestamp',
      help: 'Last successful deployment timestamp per app',
      labelNames: ['name'],
      async collect() {
        const apps = await digitalOcean.apps();

        if (!apps) {
          return;
        }

        for (const name in apps) {
          this.set({ name }, +Date.parse(apps[name].last_active_deploy));
        }
      }
    });

    new client.Gauge({
      name: 'do_account_balance',
      help: 'DigitalOcean account balance in USD',
      async collect() {
        const balances = await digitalOcean.balances();

        if (!balances) {
          return;
        }

        this.set(balances.account_balance);
      }
    });

    new client.Gauge({
      name: 'do_account_month_to_date_usage',
      help: 'DigitalOcean account month to date usage in USD',
      async collect() {
        const balances = await digitalOcean.balances();

        if (!balances) {
          return;
        }

        this.set(balances.month_to_date_usage);
      }
    });
  } catch (e: any) {
    if (e.message !== 'MISSING_KEY') {
      capture(e);
    }
  }
}
