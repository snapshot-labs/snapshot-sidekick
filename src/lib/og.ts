/// <reference path="../types/ssrf-req-filter.d.ts" />
import http from 'node:http';
import https from 'node:https';
import ogs from 'open-graph-scraper';
import { requestFilterHandler } from 'ssrf-req-filter';

const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 512 * 1024;

const httpAgent = requestFilterHandler(new http.Agent());
const httpsAgent = requestFilterHandler(new https.Agent());

export type OgPreview = {
  title?: string;
  description?: string;
  icon?: string;
};

export async function fetchPreview(input: string): Promise<OgPreview> {
  let result;
  try {
    ({ result } = await ogs({
      url: input,
      timeout: { request: FETCH_TIMEOUT_MS },
      downloadLimit: MAX_BYTES,
      agent: { http: httpAgent, https: httpsAgent }
    } as any));
  } catch (e: any) {
    throw new Error(e?.result?.error || e?.message || 'Failed to fetch preview');
  }

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch preview');
  }

  const base = result.requestUrl || input;
  return {
    title: result.ogTitle || result.twitterTitle || result.dcTitle,
    description: result.ogDescription || result.twitterDescription || result.dcDescription,
    icon: resolveIcon(result.favicon, base)
  };
}

function resolveIcon(favicon: string | undefined, base: string): string | undefined {
  try {
    return new URL(favicon || '/favicon.ico', base).toString();
  } catch {
    return undefined;
  }
}
