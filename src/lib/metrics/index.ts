import init, { client } from '@snapshot-labs/snapshot-metrics';
import networks from '@snapshot-labs/snapshot.js/src/networks.json';
import snapshot from '@snapshot-labs/snapshot.js';
import { Wallet } from '@ethersproject/wallet';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { size as queueSize } from '../queue';
import getModerationList from '../moderationList';
import DigitalOcean from './digitalOcean';
import type { Express } from 'express';
import db from '../../helpers/mysql';

export default function initMetrics(app: Express) {
  init(app, {
    normalizedPath: [['^/api/votes/.*', '/api/votes/#id']],
    whitelistedPath: [
      /^\/$/,
      /^\/api\/votes\/.*$/,
      /^\/api\/(nft-claimer)(\/(deploy|mint))?$/,
      /^\/api\/moderation$/,
      /^\/(webhook|sentry)$/
    ],
    errorHandler: capture,
    db
  });

  run();
}

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

export const timeQueueProcess = new client.Histogram({
  name: 'queue_process_duration_seconds',
  help: 'Duration in seconds of each queue process',
  labelNames: ['name'],
  buckets: [3, 7, 10, 15, 30, 60, 120]
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

const providersResponseCode = new client.Gauge({
  name: 'provider_response_code',
  help: 'Response code of each provider request',
  labelNames: ['network']
});

const providersTiming = new client.Gauge({
  name: 'provider_duration_seconds',
  help: 'Duration in seconds of each provider request',
  labelNames: ['network', 'status']
});

const providersFullArchiveNodeAvailability = new client.Gauge({
  name: 'provider_full_archive_node_availability',
  help: 'Availability of full archive node for each provider',
  labelNames: ['network']
});

const abi = ['function getEthBalance(address addr) view returns (uint256 balance)'];
const wallet = new Wallet(process.env.NFT_CLAIMER_PRIVATE_KEY as string);

function refreshProviderTiming() {
  Object.values(networks).forEach(async network => {
    const end = providersTiming.startTimer({ network: network.key });
    let status = 0;

    try {
      const provider = snapshot.utils.getProvider(network.key);
      await snapshot.utils.multicall(
        network.key,
        provider,
        abi,
        [wallet.address].map(adr => [network.multicall, 'getEthBalance', [adr]]),
        {
          blockTag: 'latest'
        }
      );
      status = 1;
      providersResponseCode.set({ network: network.key }, 200);
    } catch (e: any) {
      providersResponseCode.set({ network: network.key }, parseInt(e?.error?.status || 0));
    } finally {
      end({ status });
    }
  });
}

function refreshFullArchiveNodeChecker() {
  Object.values(networks).forEach(async network => {
    const { key, start, multicall } = network;
    try {
      const provider = snapshot.utils.getProvider(key);

      await provider.getBalance(multicall, start);
      providersFullArchiveNodeAvailability.set({ network: key }, 1);
    } catch (e: any) {
      providersFullArchiveNodeAvailability.set({ network: key }, 0);
    }
  });
}

async function run() {
  try {
    refreshProviderTiming();
    refreshFullArchiveNodeChecker();
  } catch (e) {
    capture(e);
  } finally {
    await snapshot.utils.sleep(30e3);
    await run();
  }
}
