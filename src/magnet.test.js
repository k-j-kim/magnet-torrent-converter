import { describe, expect, it } from 'vitest';
import { safeFilename, validateMagnet } from './magnet.js';

describe('validateMagnet', () => {
  it('accepts hexadecimal and base32 info hashes', () => {
    expect(validateMagnet(`magnet:?xt=urn:btih:${'a'.repeat(40)}`)).toBe('');
    expect(validateMagnet(`magnet:?xt=urn:btih:${'A'.repeat(32)}&dn=Example`)).toBe('');
  });

  it('rejects empty, non-magnet, and malformed values', () => {
    expect(validateMagnet('')).toMatch(/Paste/);
    expect(validateMagnet('https://example.com')).toMatch(/magnet URI/);
    expect(validateMagnet('magnet:?dn=NoHash')).toMatch(/info hash/);
  });
});

describe('safeFilename', () => {
  it('removes unsafe characters and appends the extension', () => {
    expect(safeFilename('../bad:name')).toBe('-bad-name.torrent');
    expect(safeFilename('')).toBe('download.torrent');
  });
});
