const BTIH_PATTERN = /(?:^|&)xt=urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})(?:&|$)/;

export function validateMagnet(value) {
  const magnet = value.trim();
  if (!magnet) return 'Paste a magnet link to continue.';
  if (!magnet.toLowerCase().startsWith('magnet:?')) return 'This does not look like a magnet URI.';

  const query = magnet.slice(magnet.indexOf('?') + 1);
  if (!BTIH_PATTERN.test(query)) {
    return 'The link needs a valid BitTorrent info hash (btih).';
  }
  return '';
}

export function safeFilename(name) {
  const cleaned = (name || 'download')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^\.+|\.+$/g, '')
    .trim()
    .slice(0, 180);
  return `${cleaned || 'download'}.torrent`;
}
