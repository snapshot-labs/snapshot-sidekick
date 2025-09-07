import init, { client } from '@snapshot-labs/snapshot-metrics';
import networks from '@snapshot-labs/snapshot.js/src/networks.json';
import fetch from 'node-fetch';
import crypto from 'crypto';
import snapshot from '@snapshot-labs/snapshot.js';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { size as queueSize } from '../queue';
import getModerationList from '../moderationList';
import DigitalOcean from './digitalOcean';
import type { Express } from 'express';
import db from '../../helpers/mysql';
import { fetchNetworks } from '../../helpers/snapshot';

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

export const cacheHitCount = new client.Counter({
  name: 'cache_hit_count',
  help: 'Number of hit/miss of the cache engine',
  labelNames: ['status', 'type']
});

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

let networkPivot = 0;
let premiumNetworks: any[] = [];

function broviderCall(network: string, method: string, params: any[] = []) {
  return fetch(`https://brovider.xyz/${network}`, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({
      method,
      params,
      id: crypto.randomBytes(4).toString('hex'),
      jsonrpc: '2.0'
    })
  });
}

async function refreshPremiumNetworks() {
  try {
    const remoteNetworks = await fetchNetworks();
    const premiumNetworkIds = remoteNetworks
      .filter((network: any) => network.premium)
      .map((network: any) => network.id);

    premiumNetworks = premiumNetworkIds
      .map((networkId: string) => networks[networkId as keyof typeof networks])
      .filter(Boolean);
  } catch (e: any) {
    console.log(e);
  }
}

async function refreshProviderTiming(network: any) {
  const { broviderId, key, starknet } = network;
  const end = providersTiming.startTimer({ network: key });
  let status = 0;
  let responseCode = 0;

  try {
    const response = await broviderCall(
      broviderId || key,
      starknet ? 'starknet_blockNumber' : 'eth_blockNumber'
    );
    responseCode = response.status;
    const data = await response.json();
    status = data.result ? 1 : 0;
  } catch (e: any) {
  } finally {
    providersResponseCode.set({ network: key }, responseCode);
    end({ status });
  }
}

async function refreshFullArchiveNodeChecker(network: any) {
  const { key, start, broviderId, starknet, multicall } = network;
  try {
    const response = await broviderCall(
      broviderId || key,
      starknet ? 'starknet_getClassAt' : 'eth_getCode',
      starknet ? [{ block_number: start }, multicall] : [multicall, `0x${start.toString(16)}`]
    );
    const data = await response.json();
    providersFullArchiveNodeAvailability.set(
      { network: key },
      response.status === 200 && data.result && data.result !== '0x' ? 1 : 0
    );
  } catch (e: any) {
    providersFullArchiveNodeAvailability.set({ network: key }, 0);
  }
}

async function run() {
  if (networkPivot === 0) {
    await refreshPremiumNetworks();
  }

  if (premiumNetworks.length) {
    const network = premiumNetworks[networkPivot];

    refreshProviderTiming(network);
    refreshFullArchiveNodeChecker(network);

    networkPivot++;
    if (networkPivot > premiumNetworks.length - 1) networkPivot = 0;
  }

  await snapshot.utils.sleep(5e3);
  run();
}
