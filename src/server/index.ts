import { Hono } from 'hono';
import * as fs from 'fs';
import * as path from 'path';

const app = new Hono();

// In-memory identifier → entry id cache so UUID-keyed share URLs don't require
// listing the whole collection on every page view. TTL keeps it fresh.
const identifierCache = new Map<string, { entryId: string; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const cacheLookup = (identifier: string): string | null => {
  const hit = identifierCache.get(identifier);
  if (!hit) return null;
  if (Date.now() - hit.cachedAt > CACHE_TTL_MS) {
    identifierCache.delete(identifier);
    return null;
  }
  return hit.entryId;
};

const cacheSet = (identifier: string, entryId: string) => {
  identifierCache.set(identifier, { entryId, cachedAt: Date.now() });
};

// Serve static files from public or dist folders first (matches heylookatme architecture)
app.get('/*', async (c, next) => {
  const reqPath = c.req.path;

  // Skip rendering routes and API proxy routes
  if (
    reqPath === '/' ||
    reqPath === '/studio' ||
    reqPath === '/terms' ||
    reqPath === '/faq' ||
    reqPath.startsWith('/api/')
  ) {
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
const renderInertiaPage = (componentName: string, props = {}, search = '') => {
  const baseUrl =
    componentName === 'Home'
      ? '/'
      : componentName === 'Studio'
        ? '/studio'
        : componentName === 'Faq'
          ? '/faq'
          : '/terms';
  const pageData = JSON.stringify({
    component: componentName,
    props,
    url: baseUrl + search,
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
    <title>Shotage Studio — Turn Screenshots into Stunning Mockups</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" crossorigin="anonymous" />
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
// Fetch a shared design. The URL key is the identifier UUID (new links) or the
// entry id (legacy links). Resolves identifiers through a cached map.
app.get('/api/share/:id', async (c) => {
  const apiKey = process.env.MORPHIC_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Sharing is not configured yet' }, 500);
  }

  const cmsBase = 'https://main-workspace.morphic-cms.com';
  const headers = { Authorization: `Bearer ${apiKey}` };
  const id = c.req.param('id');

  let entryId: string | null = null;
  let fetchedEntry: any = null;

  if (/^\d+$/.test(id)) {
    // Legacy numeric entry id — fetch directly
    entryId = id;
  } else {
    entryId = cacheLookup(id);
  }

  if (entryId) {
    const res = await fetch(`${cmsBase}/api/entries/${entryId}`, { headers });
    if (res.ok) fetchedEntry = await res.json();
  }

  // Miss (or stale cache): list the collection and match by identifier, then cache
  if (!fetchedEntry) {
    const listRes = await fetch(
      `${cmsBase}/api/collections/shotage-shareables/entries?limit=1000`,
      { headers }
    );
    if (listRes.ok) {
      const list = await listRes.json();
      const items = list?.entries || (Array.isArray(list) ? list : []);
      const found =
        items.find((item: any) => item?.content?.identifier === id || item?.identifier === id) ||
        (entryId ? items.find((item: any) => String(item?.id) === entryId) : undefined);
      if (found) {
        fetchedEntry = found;
        if (found?.content?.identifier && found?.id != null) {
          cacheSet(found.content.identifier, String(found.id));
        }
      }
    }
  }

  if (!fetchedEntry) {
    return c.json({ error: 'Design not found' }, 404);
  }

  // Morphic CMS nests entry fields under .content
  const entry = fetchedEntry?.entry || fetchedEntry?.data || fetchedEntry;
  const content = entry?.content || entry;
  const jsonString = content?.json_string;
  if (!jsonString) {
    return c.json({ error: 'Design has no data' }, 404);
  }

  return c.json({
    name: content?.name || entry?.name || '',
    publisher: content?.publisher || entry?.publisher || '',
    identifier: content?.identifier || entry?.identifier || '',
    json_string: jsonString,
    is_in_review: content?.is_in_review || entry?.is_in_review || 'no',
    is_in_explore: content?.is_in_explore || entry?.is_in_explore || 'no',
    thumbnail: content?.thumbnail || entry?.thumbnail || null,
  });
});

// Share a design: verifies Cloudflare Turnstile, then stores in Morphic CMS.
// Creates a new entry on first share, updates the same entry on re-shares (dedup).
app.post('/api/share', async (c) => {
  const body = await c.req.json();
  const { name, publisher, identifier, json_string, turnstileToken, entryId, thumbnail } =
    body || {};

  if (!name || !publisher || !identifier || !json_string) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  // Verify Cloudflare Turnstile token server-side to prevent spam
  const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET;
  if (turnstileSecret) {
    if (!turnstileToken) {
      return c.json({ error: 'Captcha verification required' }, 400);
    }
    const verifyForm = new FormData();
    verifyForm.append('secret', turnstileSecret);
    verifyForm.append('response', turnstileToken);
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: verifyForm,
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return c.json({ error: 'Captcha verification failed' }, 400);
    }
  }

  const apiKey = process.env.MORPHIC_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Sharing is not configured yet' }, 500);
  }

  const cmsBase = process.env.MORPHIC_API_URL || 'https://main-workspace.morphic-cms.com';
  const MEDIA_FOLDER_ID = 22;

  // Upload thumbnail to Morphic CMS media endpoint if provided
  let thumbnailMedia: any = null;
  if (thumbnail && typeof thumbnail === 'string') {
    try {
      const match = thumbnail.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      let fileBlob: Blob;
      let fileName = `${identifier}.webp`;

      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType.includes('png')
          ? 'png'
          : mimeType.includes('jpeg') || mimeType.includes('jpg')
            ? 'jpg'
            : 'webp';
        fileName = `${identifier}.${ext}`;
        const buffer = Buffer.from(base64Data, 'base64');
        fileBlob = new Blob([buffer], { type: mimeType });
      } else {
        fileBlob = new Blob([thumbnail], { type: 'image/webp' });
      }

      const mediaForm = new FormData();
      mediaForm.append('file', fileBlob, fileName);
      mediaForm.append('folderId', String(MEDIA_FOLDER_ID));

      const uploadRes = await fetch(`${cmsBase}/api/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: mediaForm,
      });

      if (uploadRes.ok) {
        const uploadJson = await uploadRes.json();
        thumbnailMedia = uploadJson?.media || uploadJson?.data || uploadJson;
      } else {
        console.error('Media upload failed:', await uploadRes.text());
      }
    } catch (err) {
      console.error('Error uploading thumbnail media:', err);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const payload = JSON.stringify({
    name,
    publisher,
    identifier,
    json_string,
    is_in_review: 'no',
    is_in_explore: 'no',
    thumbnail: thumbnailMedia,
  });

  // Upsert: PUT to existing entry when entryId is provided, otherwise POST to create
  const isUpdate = Boolean(entryId);
  const cmsRes = isUpdate
    ? await fetch(`${cmsBase}/api/entries/${entryId}`, {
        method: 'PUT',
        headers,
        body: payload,
      })
    : await fetch(`${cmsBase}/api/collections/shotage-shareables/entries`, {
        method: 'POST',
        headers,
        body: payload,
      });

  if (!cmsRes.ok) {
    const detail = await cmsRes.text();
    return c.json({ error: 'Failed to save design', detail }, 502);
  }

  // Extract the entry id from the CMS response (varies by API shape)
  let createdId: string | null = entryId || null;
  if (!isUpdate) {
    try {
      const cmsJson = await cmsRes.json();
      createdId = cmsJson?.id || cmsJson?.data?.id || cmsJson?.['entry']?.id || null;
    } catch (e) {
      // ignore parse errors, fall back to null
    }
  }

  const origin = new URL(c.req.url).origin;
  // Key the shared URL on the identifier (a random UUID) so entry ids aren't guessable by visitors
  if (createdId) cacheSet(identifier, createdId);
  return c.json({
    url: `${origin}/studio?s=${identifier}`,
    identifier,
    entryId: createdId,
  });
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
  const s = c.req.query('s');
  const search = s ? `?s=${encodeURIComponent(s as string)}` : '';
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Studio', props: {}, url: `/studio${search}` });
  }
  return c.html(renderInertiaPage('Studio', {}, search));
});

app.get('/terms', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Terms', props: {}, url: '/terms' });
  }
  return c.html(renderInertiaPage('Terms'));
});

app.get('/faq', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Faq', props: {}, url: '/faq' });
  }
  return c.html(renderInertiaPage('Faq'));
});

// Export default Hono app for Vercel & Vite dev server
export default app;
