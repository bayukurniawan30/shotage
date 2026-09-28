import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cargoName = process.platform === 'win32' ? 'cargo.exe' : 'cargo';
const candidateDirs = [
  path.join(homedir(), '.cargo', 'bin'),
  '/opt/homebrew/opt/rustup/bin',
  '/usr/local/opt/rustup/bin',
];

let rustPath = process.env.PATH || '';
const cargoOnPath =
  spawnSync(cargoName, ['--version'], {
    env: { ...process.env, PATH: rustPath },
    stdio: 'ignore',
  }).status === 0;

if (!cargoOnPath) {
  const cargoDir = candidateDirs.find((dir) => existsSync(path.join(dir, cargoName)));
  if (!cargoDir) {
    console.error('Cargo was not found. Install Rustup and run `rustup default stable` first.');
    process.exit(1);
  }
  rustPath = `${cargoDir}${path.delimiter}${rustPath}`;
}

const cliPath = fileURLToPath(new URL('../node_modules/@tauri-apps/cli/tauri.js', import.meta.url));
const child = spawn(process.execPath, [cliPath, ...process.argv.slice(2)], {
  env: { ...process.env, PATH: rustPath },
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error('Could not start the Tauri CLI:', error);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exitCode = code ?? 1;
  }
});
