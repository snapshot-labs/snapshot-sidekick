import http from 'node:http';
import https from 'node:https';
import ogs from 'open-graph-scraper';
// @ts-ignore
import { requestFilterHandler } from 'ssrf-req-filter';

const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 512 * 1024;

const agent = {
  http: requestFilterHandler(new http.Agent()),
  https: requestFilterHandler(new https.Agent())
};

export type OgPreview = {
  title?: string;
  description?: string;
  icon?: string;
};

export async function fetchPreview(url: string): Promise<OgPreview> {
  try {
    const { result } = await ogs({
      url,
      timeout: { request: FETCH_TIMEOUT_MS },
      downloadLimit: MAX_BYTES,
      agent
    } as any);
    return {
      title: result.ogTitle || result.twitterTitle || result.dcTitle,
      description: result.ogDescription || result.twitterDescription || result.dcDescription,
      icon: new URL(result.favicon || '/favicon.ico', result.requestUrl || url).toString()
    };
  } catch {
    // Link previews are best-effort: a fetch failure (timeout, blocked host,
    // oversized page, no metadata) is an expected outcome, not an error.
    // Degrade to an icon-only preview instead of throwing.
    try {
      return { icon: new URL('/favicon.ico', url).toString() };
    } catch {
      return {};
    }
  }
}
