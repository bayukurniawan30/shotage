import type { Plugin } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export function pwaBuildPlugin(): Plugin {
  let root: string;
  let outDir: string;
  return {
    name: 'shotage-pwa-build',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(root, config.build.outDir);
    },
    async writeBundle() {
      const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
      const id = commit ? commit.slice(0, 12) : String(Date.now());
      const source = await readFile(path.join(root, 'src/pwa/service-worker.js'), 'utf8');
      const output = source.replace('__BUILD_ID__', id.replace(/[^a-zA-Z0-9-]/g, ''));
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, 'pwa-worker.js'), output);
      // Vercel/Hono also serves public files. This is an ignored generated
      // artifact, just like public/assets, not the service-worker source.
      await writeFile(path.join(root, 'public/pwa-worker.js'), output);
    },
  };
}
