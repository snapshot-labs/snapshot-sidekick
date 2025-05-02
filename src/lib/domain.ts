import { capture } from '@snapshot-labs/snapshot-sentry';
import { sleep } from '../helpers/utils';

const LIST_URL =
  'https://raw.githubusercontent.com/snapshot-labs/snapshot-spaces/master/spaces/domains.json';

const REFRESH_INTERVAL = 1000 * 60 * 5; // 5 minutes

// Map of domain (vote.snapshot.org) to space ID (s:snapshot.eth/eth:0x0)
let data = new Map<string, string>();

export function getDomain(domain: string): string | null {
  return data.get(domain.toLowerCase()) ?? null;
}

export async function initDomainsRefresher() {
  try {
    console.log(`[domains-refresh] Refreshing domains list`);
    await refreshList();
    console.log(`[domains-refresh] ${data.size} domains found`);
  } catch (e) {
    capture(e);
  } finally {
    await sleep(REFRESH_INTERVAL);
    await initDomainsRefresher();
  }
}

async function refreshList() {
  const response = await fetch(LIST_URL, {
    headers: {
      'content-type': 'application/json'
    }
  });

  const body: Record<string, string> = await response.json();

  data = new Map(Object.entries(body).map(([domain, spaceId]) => [domain, `s:${spaceId}`]));
}
