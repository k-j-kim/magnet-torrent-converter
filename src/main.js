import WebTorrent from 'webtorrent';
import { safeFilename, validateMagnet } from './magnet.js';
import './style.css';

const TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.webtorrent.dev',
];
const TIMEOUT_MS = 90_000;

const form = document.querySelector('#convert-form');
const input = document.querySelector('#magnet-input');
const error = document.querySelector('#magnet-error');
const pasteButton = document.querySelector('#paste-button');
const convertButton = document.querySelector('#convert-button');
const cancelButton = document.querySelector('#cancel-button');
const progressPanel = document.querySelector('#progress-panel');
const progressStatus = document.querySelector('#progress-status');
const peerDetail = document.querySelector('#peer-detail');
const elapsedTime = document.querySelector('#elapsed-time');
const status = document.querySelector('#status');

let client = null;
let timeoutId = null;
let tickerId = null;
let startedAt = 0;

function setError(message = '') {
  error.textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function setBusy(isBusy) {
  input.readOnly = isBusy;
  pasteButton.disabled = isBusy;
  convertButton.hidden = isBusy;
  cancelButton.hidden = !isBusy;
  progressPanel.hidden = !isBusy;
  form.setAttribute('aria-busy', String(isBusy));
}

function updateElapsed() {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  elapsedTime.textContent = `${seconds}s`;
}

async function stopClient() {
  clearTimeout(timeoutId);
  clearInterval(tickerId);
  timeoutId = null;
  tickerId = null;
  if (client) {
    const activeClient = client;
    client = null;
    try {
      await activeClient.destroy();
    } catch {
      // The client may already have closed its sockets.
    }
  }
}

function downloadTorrent(torrent) {
  const bytes = torrent.torrentFile;
  if (!bytes) throw new Error('The peer returned metadata that could not be packaged.');

  const blob = new Blob([bytes], { type: 'application/x-bittorrent' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeFilename(torrent.name);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function reset(message = '') {
  await stopClient();
  setBusy(false);
  if (message) status.textContent = message;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const magnet = input.value.trim();
  const validationError = validateMagnet(magnet);
  setError(validationError);
  if (validationError) {
    input.focus();
    return;
  }

  status.textContent = '';
  progressStatus.textContent = 'Looking for peers…';
  peerDetail.textContent = 'Connecting through public WebTorrent trackers.';
  elapsedTime.textContent = '0s';
  setBusy(true);
  startedAt = Date.now();
  tickerId = setInterval(updateElapsed, 1_000);

  client = new WebTorrent();
  const thisClient = client;
  thisClient.on('error', (clientError) => {
    if (client !== thisClient) return;
    reset(`Conversion failed: ${clientError.message}`);
  });

  timeoutId = setTimeout(() => {
    if (client !== thisClient) return;
    reset('Timed out after 90 seconds. No WebRTC peer returned metadata; try again later or use a desktop torrent client.');
  }, TIMEOUT_MS);

  try {
    const torrent = thisClient.add(magnet, { announce: TRACKERS });
    torrent.on('wire', () => {
      if (client !== thisClient) return;
      progressStatus.textContent = 'Peer found—fetching metadata…';
      peerDetail.textContent = `${torrent.numPeers} WebRTC peer${torrent.numPeers === 1 ? '' : 's'} connected.`;
    });
    torrent.on('metadata', async () => {
      if (client !== thisClient) return;
      try {
        downloadTorrent(torrent);
        await reset(`Downloaded ${safeFilename(torrent.name)}. Your file is ready.`);
      } catch (downloadError) {
        await reset(`Could not create the file: ${downloadError.message}`);
      }
    });
    torrent.on('error', (torrentError) => {
      if (client !== thisClient) return;
      reset(`Could not retrieve metadata: ${torrentError.message}`);
    });
  } catch (addError) {
    await reset(`Could not process that magnet link: ${addError.message}`);
  }
});

cancelButton.addEventListener('click', () => reset('Conversion cancelled.'));

pasteButton.addEventListener('click', async () => {
  try {
    input.value = await navigator.clipboard.readText();
    setError(validateMagnet(input.value));
    input.focus();
  } catch {
    status.textContent = 'Clipboard access was blocked. Paste with Ctrl+V or Command+V instead.';
    input.focus();
  }
});

input.addEventListener('input', () => {
  if (input.getAttribute('aria-invalid') === 'true') setError(validateMagnet(input.value));
});

input.addEventListener('blur', () => {
  if (input.value.trim()) setError(validateMagnet(input.value));
});

window.addEventListener('pagehide', () => stopClient());
