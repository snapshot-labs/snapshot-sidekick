import { fetchPreview } from '../../../src/lib/og';

jest.mock('open-graph-scraper', () => jest.fn());
const ogs = jest.requireMock('open-graph-scraper') as jest.Mock;

function mockOgsResult(result: Record<string, any>) {
  ogs.mockResolvedValueOnce({ error: false, result: { success: true, ...result }, response: {} });
}

function mockOgsThrow(error: any) {
  ogs.mockRejectedValueOnce(error);
}

describe('fetchPreview', () => {
  beforeEach(() => ogs.mockReset());

  it('returns title, description, and resolved icon from og fields', async () => {
    mockOgsResult({
      ogTitle: 'OG Title',
      ogDescription: 'OG description',
      favicon: '/icon.png',
      requestUrl: 'https://example.com/page'
    });

    expect(await fetchPreview('https://example.com/page')).toEqual({
      title: 'OG Title',
      description: 'OG description',
      icon: 'https://example.com/icon.png'
    });
  });

  it('falls back to twitter then dc fields', async () => {
    mockOgsResult({
      twitterTitle: 'Twitter Title',
      dcDescription: 'DC description',
      requestUrl: 'https://example.com/'
    });

    const out = await fetchPreview('https://example.com/');
    expect(out.title).toBe('Twitter Title');
    expect(out.description).toBe('DC description');
  });

  it('falls back to /favicon.ico when favicon is missing', async () => {
    mockOgsResult({ ogTitle: 'X', requestUrl: 'https://example.com/page' });
    expect((await fetchPreview('https://example.com/page')).icon).toBe(
      'https://example.com/favicon.ico'
    );
  });

  it('resolves a relative favicon against requestUrl', async () => {
    mockOgsResult({ favicon: 'favicon.png', requestUrl: 'https://example.com/sub/' });
    expect((await fetchPreview('https://example.com/sub/')).icon).toBe(
      'https://example.com/sub/favicon.png'
    );
  });

  it('falls back to an icon-only preview when ogs throws', async () => {
    mockOgsThrow({
      error: true,
      result: { success: false, error: 'Call to 127.0.0.1 is blocked.' }
    });
    await expect(fetchPreview('http://127.0.0.1/')).resolves.toEqual({
      icon: 'http://127.0.0.1/favicon.ico'
    });
  });

  it('falls back to an icon-only preview when ogs throws without details', async () => {
    mockOgsThrow(new Error('boom'));
    await expect(fetchPreview('https://example.com/page')).resolves.toEqual({
      icon: 'https://example.com/favicon.ico'
    });
  });

  it('returns an empty preview when the URL itself is unparseable', async () => {
    mockOgsThrow(new Error('boom'));
    await expect(fetchPreview('::not-a-url::')).resolves.toEqual({});
  });
});
