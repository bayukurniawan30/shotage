import { Hono } from 'hono';
import * as fs from 'fs';
import * as path from 'path';

const app = new Hono();

// Serve static files from public or dist folders first (matches heylookatme architecture)
app.get('/*', async (c, next) => {
  const reqPath = c.req.path;

  // Skip rendering routes and API proxy routes
  if (reqPath === '/' || reqPath === '/studio' || reqPath === '/terms' || reqPath.startsWith('/api/')) {
    return await next();
  }

  const publicPath = path.join(process.cwd(), 'public', reqPath);
  const distPath = path.join(process.cwd(), 'dist', reqPath);

  let targetPath: string | null = null;
  if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
    targetPath = publicPath;
  } else if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
    targetPath = distPath;
  }

  if (targetPath) {
    const content = fs.readFileSync(targetPath);
    const ext = path.extname(targetPath);
    let mime = 'application/octet-stream';
    if (ext === '.png') mime = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
    else if (ext === '.gif') mime = 'image/gif';
    else if (ext === '.svg') mime = 'image/svg+xml';
    else if (ext === '.ico') mime = 'image/x-icon';
    else if (ext === '.js') mime = 'application/javascript';
    else if (ext === '.css') mime = 'text/css';

    return c.body(content, 200, { 'Content-Type': mime });
  }

  await next();
});

// Inertia HTML Page Renderer
const renderInertiaPage = (componentName: string, props = {}) => {
  const pageData = JSON.stringify({
    component: componentName,
    props,
    url: componentName === 'Home' ? '/' : componentName === 'Studio' ? '/studio' : '/terms',
    version: null,
  });

  // Inject into index.html
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf-8');
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

app.get('/terms', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Terms', props: {}, url: '/terms' });
  }
  return c.html(renderInertiaPage('Terms'));
});

// Export default Hono app for Vercel & Vite dev server
export default app;
