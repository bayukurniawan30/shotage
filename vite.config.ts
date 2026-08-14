import { defineConfig, loadEnv } from 'vite';
import devServer from '@hono/vite-dev-server';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load .env files into process.env so the Hono dev server can read
  // server-side secrets (MORPHIC_API_KEY, CLOUDFLARE_TURNSTILE_SECRET)
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [
      react(),
      devServer({
        entry: 'src/server/index.ts',
        exclude: [
          /^\/(?!api).*/,
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
      open: true,
    },
  };
});
