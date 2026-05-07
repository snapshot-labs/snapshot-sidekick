import { isIP } from 'node:net';

const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 512 * 1024;
const USER_AGENT = 'Snapshot-Sidekick/1.0 (+https://snapshot.org)';

export type OgPreview = {
  title?: string;
  description?: string;
  icon?: string;
};

const PRIVATE_IPV4_RE =
  /^(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|0\.|100\.(?:6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.)/;

const PRIVATE_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);

export function assertSafeUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed');
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const ipKind = isIP(host);
  const isPrivate =
    PRIVATE_HOSTNAMES.has(host) ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    (ipKind === 4 && PRIVATE_IPV4_RE.test(host)) ||
    (ipKind === 6 && /^(?:::1|fc|fd|fe80)/.test(host));

  if (isPrivate) throw new Error('Private host not allowed');

  return url;
}

function getAttr(attrs: string, name: string): string | undefined {
  return attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
}

function extractMetaMap(html: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const key = (getAttr(m[1], 'name') ?? getAttr(m[1], 'property'))?.toLowerCase();
    const value = getAttr(m[1], 'content');
    if (key && value !== undefined && !out.has(key)) out.set(key, value);
  }
  return out;
}

function extractIconHref(html: string): string | undefined {
  for (const m of html.matchAll(/<link\b([^>]*)>/gi)) {
    const rel = getAttr(m[1], 'rel')?.toLowerCase();
    if (rel === 'icon' || rel === 'shortcut icon' || rel === 'apple-touch-icon') {
      return getAttr(m[1], 'href');
    }
  }
  return undefined;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#x27': "'"
};

function decode(s: string): string {
  return s
    .replace(/&([a-z#x0-9]+);/gi, (raw, e) => ENTITIES[e.toLowerCase()] ?? raw)
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveUrl(href: string, base: URL): string | undefined {
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

export function parsePreview(html: string, base: URL): OgPreview {
  const meta = extractMetaMap(html);
  const title =
    meta.get('og:title') ??
    meta.get('twitter:title') ??
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const description =
    meta.get('og:description') ?? meta.get('twitter:description') ?? meta.get('description');
  const iconHref = extractIconHref(html);

  return {
    title: title ? decode(title) || undefined : undefined,
    description: description ? decode(description) || undefined : undefined,
    icon: iconHref ? resolveUrl(iconHref, base) : resolveUrl('/favicon.ico', base)
  };
}

export async function fetchPreview(input: string): Promise<OgPreview> {
  const url = assertSafeUrl(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get('content-type') ?? '';
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      throw new Error(`Unsupported content-type: ${contentType || 'unknown'}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      chunks.push(value);
      if (received >= MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
    return parsePreview(Buffer.concat(chunks).toString('utf8'), new URL(res.url));
  } finally {
    clearTimeout(timer);
  }
}
