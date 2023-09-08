import fetch from 'node-fetch';
import { capture } from '@snapshot-labs/snapshot-sentry';

const BASE_URL = 'https://api.digitalocean.com/v2';
const TTL = 60 * 1000; // 1 minute

export default class DigitalOcean {
  key?: string;
  cache: Record<string, any> = {};
  expirationTime = 0;

  constructor() {
    this.key = process.env.DIGITAL_OCEAN_TOKEN;

    if (!this.key) {
      throw new Error('MISSING_KEY');
    }
  }

  async apps() {
    try {
      const results = await this.#fetch(`apps`);
      const apps: Record<string, any> = {};

      for (const app of results.apps) {
        apps[app.spec.name] = {
          tier: app.spec.services[0].instance_size_slug,
          instance_count: app.spec.services[0].instance_count,
          region: app.region.slug,
          country: app.region.flag,
          last_active_deploy: app.last_deployment_active_at
        };
      }

      return apps;
    } catch (e: any) {
      capture(e);
      return false;
    }
  }

  async appInstances() {
    try {
      const results = await this.#fetch(`apps/tiers/instance_sizes`);
      const instances: Record<string, any> = {};

      for (const datum of results.instance_sizes) {
        instances[datum.slug] = datum;
      }

      return instances;
    } catch (e: any) {
      capture(e);
      return false;
    }
  }

  async balances() {
    try {
      return await this.#fetch(`customers/my/balance`);
    } catch (e: any) {
      capture(e);
      return false;
    }
  }

  async #fetch(path: string) {
    const cacheKey = path;
    const cachedEntry = this.cache[cacheKey];
    const now = Date.now();
    if (cachedEntry && this.expirationTime > now) {
      return cachedEntry;
    }

    if (this.expirationTime < now) {
      this.cache = {};
      this.expirationTime = now + TTL;
    }

    const response = await fetch(`${BASE_URL}/${path}`, {
      headers: { Authorization: `Bearer ${this.key}` }
    });

    const result = await response.json();

    if (response.status !== 200 || result.error) {
      throw new Error(result.error || result.message);
    }

    this.cache[cacheKey] = result;

    return result;
  }
}
