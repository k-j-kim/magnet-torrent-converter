import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = await mkdtemp(join(tmpdir(), 'magnet-smoke-'));
const output = [];

const child = spawn(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--user-data-dir=${profile}`,
  '--enable-logging=stderr',
  '--v=0',
  '--virtual-time-budget=5000',
  '--dump-dom',
  process.argv[2] || 'http://localhost:4173/',
]);

child.stderr.on('data', (chunk) => output.push(chunk));
child.stdout.resume();
const exitCode = await new Promise((resolve) => child.on('close', resolve));
const logs = Buffer.concat(output).toString();
await rm(profile, { recursive: true, force: true });

const consoleErrors = logs
  .split('\n')
  .filter((line) => line.includes('INFO:CONSOLE') && /uncaught|error/i.test(line));

if (exitCode !== 0 || consoleErrors.length) {
  console.error(consoleErrors.join('\n') || logs);
  process.exit(1);
}

console.log('Browser smoke test passed: no console runtime errors.');
