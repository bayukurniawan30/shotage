import { defineConfig, loadEnv } from 'vite';
import devServer from '@hono/vite-dev-server';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { cp } from 'node:fs/promises';
import { pwaBuildPlugin } from './scripts/pwa-build';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const desktopBuild = Boolean(process.env.TAURI_ENV_PLATFORM) && mode === 'production';
  // Load .env files so the Hono dev server can access
  // server-side environment variables.
  const env = loadEnv(mode, process.cwd(), '');

  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [
      react(),
      ...(!desktopBuild ? [pwaBuildPlugin()] : []),

      ...(desktopBuild
        ? [
            {
              name: 'shotage-desktop-public-files',
              async closeBundle() {
                const publicRoot = path.resolve(__dirname, 'public');
                await cp(publicRoot, path.resolve(__dirname, 'dist'), {
                  recursive: true,
                  filter: (source) => {
                    const relative = path.relative(publicRoot, source);
                    return relative !== 'assets' && !relative.startsWith(`assets${path.sep}`);
                  },
                });
              },
            },
          ]
        : []),

      devServer({
        entry: 'src/server/index.ts',
        exclude: [
          // Let Vite handle pages/assets, while Hono handles API and MCP/OAuth routes.
          /^\/(?!(?:api|mcp|oauth|\.well-known)(?:\/|$)).*/,

          /.*\.css$/,
          /.*\.js$/,
          /.*\.ts$/,
          /.*\.tsx$/,
          /.*\.json$/,
          /@vite\/client/,
          /@react-refresh/,
        ],
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 5173,
      strictPort: true,
      open: !process.env.TAURI_ENV_PLATFORM,
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },

    // public/assets contains mirrored output from older web builds. Copy the
    // other public files, but never package those stale bundles in desktop.
    publicDir: desktopBuild ? false : 'public',
  };
});
