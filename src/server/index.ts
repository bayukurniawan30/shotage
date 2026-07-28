import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const app = new Hono();

// Serve static assets from dist
app.use('/*', serveStatic({ root: './dist' }));

// Inertia HTML Page Renderer
const renderInertiaPage = (componentName: string, props = {}) => {
  const pageData = JSON.stringify({
    component: componentName,
    props,
    url: componentName === 'Home' ? '/' : '/studio',
    version: null,
  });

  // Inject into index.html
  const indexPath = join(process.cwd(), 'dist', 'index.html');
  if (existsSync(indexPath)) {
    let html = readFileSync(indexPath, 'utf-8');
    return html.replace(
      '<div id="app"></div>',
      `<div id="app" data-page='${pageData.replace(/'/g, '&apos;')}'></div>`
    );
  }

  // Fallback for dev mode / raw rendering
  return `<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-950 text-slate-100 antialiased">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shotage — Turn Screenshots into Stunning Mockups</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <script type="module">
      import '/src/index.css';
    </script>
    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body class="h-full bg-slate-950 text-slate-100">
    <div id="app" data-page='${pageData.replace(/'/g, '&apos;')}'></div>
  </body>
</html>`;
};

// Image Proxying Route to bypass CORS tainting
app.get('/api/proxy-image', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.text('Missing image URL', 400);

  try {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = await res.arrayBuffer();

    c.header('Access-Control-Allow-Origin', '*');
    c.header('Content-Type', contentType);
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(buffer);
  } catch (err) {
    return c.text('Failed to fetch image', 500);
  }
});

// App Routes
app.get('/', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Home', props: {}, url: '/' });
  }
  return c.html(renderInertiaPage('Home'));
});

app.get('/studio', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Studio', props: {}, url: '/studio' });
  }
  return c.html(renderInertiaPage('Studio'));
});

// Export default Hono app for Vercel & Vite dev server
export default app;

const port = Number(process.env.PORT) || 3000;
console.log(`Shotage server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
