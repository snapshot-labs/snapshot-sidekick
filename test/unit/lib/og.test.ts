import { assertSafeUrl, parsePreview } from '../../../src/lib/og';

describe('og', () => {
  describe('assertSafeUrl', () => {
    it('accepts a public https URL', () => {
      expect(assertSafeUrl('https://example.com/x').toString()).toBe('https://example.com/x');
    });

    it('rejects non-http(s) protocols', () => {
      expect(() => assertSafeUrl('file:///etc/passwd')).toThrow(/http\/https/);
      expect(() => assertSafeUrl('ftp://example.com')).toThrow(/http\/https/);
    });

    it('rejects malformed URLs', () => {
      expect(() => assertSafeUrl('not a url')).toThrow(/Invalid URL/);
    });

    it.each([
      'http://localhost/',
      'http://127.0.0.1/',
      'http://10.0.0.1/',
      'http://192.168.0.1/',
      'http://172.16.0.1/',
      'http://172.31.255.255/',
      'http://169.254.169.254/', // AWS instance metadata
      'http://0.0.0.0/',
      'http://foo.localhost/',
      'http://my-host.local/',
      'http://[::1]/',
      'http://[fc00::1]/',
      'http://[fe80::1]/'
    ])('rejects private host %s', host => {
      expect(() => assertSafeUrl(host)).toThrow(/Private host/);
    });

    it('allows public IPs that look like edge cases', () => {
      expect(() => assertSafeUrl('http://172.32.0.1/')).not.toThrow();
      expect(() => assertSafeUrl('http://11.0.0.1/')).not.toThrow();
    });
  });

  describe('parsePreview', () => {
    const base = new URL('https://example.com/page');

    it('extracts og:title, og:description, and link rel=icon', () => {
      const html = `
        <html><head>
          <title>Fallback</title>
          <meta property="og:title" content="OG Title" />
          <meta property="og:description" content="OG description" />
          <link rel="icon" href="/icon.png" />
        </head></html>`;

      expect(parsePreview(html, base)).toEqual({
        title: 'OG Title',
        description: 'OG description',
        icon: 'https://example.com/icon.png'
      });
    });

    it('falls back to <title> and meta description', () => {
      const html = `
        <html><head>
          <title>Fallback Title</title>
          <meta name="description" content="Fallback description" />
        </head></html>`;

      const out = parsePreview(html, base);
      expect(out.title).toBe('Fallback Title');
      expect(out.description).toBe('Fallback description');
      expect(out.icon).toBe('https://example.com/favicon.ico');
    });

    it('handles attributes in any order', () => {
      const html = `<meta content="Reversed" property="og:title">`;
      expect(parsePreview(html, base).title).toBe('Reversed');
    });

    it('decodes html entities and collapses whitespace', () => {
      const html = `<meta property="og:title" content="A &amp; B   &quot;Test&quot;">`;
      expect(parsePreview(html, base).title).toBe('A & B "Test"');
    });

    it('resolves relative icon URLs against the response URL', () => {
      const html = `<link rel="shortcut icon" href="favicon.png">`;
      expect(parsePreview(html, base).icon).toBe('https://example.com/favicon.png');
    });

    it('prefers og:title over twitter:title and <title>', () => {
      const html = `
        <title>Bottom</title>
        <meta name="twitter:title" content="Twitter">
        <meta property="og:title" content="OG">`;
      expect(parsePreview(html, base).title).toBe('OG');
    });

    it('returns no title/description when none present, and falls back to /favicon.ico', () => {
      const html = `<html><body>nothing</body></html>`;
      expect(parsePreview(html, base)).toEqual({
        title: undefined,
        description: undefined,
        icon: 'https://example.com/favicon.ico'
      });
    });
  });
});
