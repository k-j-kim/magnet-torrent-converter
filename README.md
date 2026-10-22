# Magnet → Torrent

A static, GitHub Pages–hostable web app that retrieves BitTorrent metadata from a magnet URI through WebTorrent/WebRTC and downloads it as a standard `.torrent` file.

## Important limitation

A browser cannot connect to ordinary TCP/uTP BitTorrent peers. It can only retrieve metadata from **WebRTC-capable peers discovered through WebSocket trackers**. A healthy magnet may therefore time out here while still working in a desktop client.

No backend is used, and the app does not upload magnet links to an API. Public trackers and connected peers can still observe the user's IP address, as with normal peer-to-peer software.

## Local development

```bash
npm install
npm run dev
```

Tests and production build:

```bash
npm test
npm run build
```

## Deploy to GitHub Pages

1. Push this directory to a GitHub repository.
2. In **Settings → Pages**, select **GitHub Actions** as the source.
3. Push to `main`, or run the workflow manually.

The Vite base is relative, so project pages such as `https://user.github.io/repository/` work without extra configuration.

Only use BitTorrent content you are legally entitled to access.
