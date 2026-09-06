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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@phosphor-icons')) return 'vendor-phosphor';
              if (id.includes('@untitledui/icons')) return 'vendor-untitledui';
              if (id.includes('remotion') || id.includes('@remotion')) return 'vendor-remotion';
              if (id.includes('coolshapes')) return 'vendor-coolshapes';
              if (id.includes('framer-motion')) return 'vendor-motion';
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('zustand') ||
                id.includes('zundo')
              ) {
                return 'vendor-framework';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  };
});
