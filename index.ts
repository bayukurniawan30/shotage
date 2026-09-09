import { Hono, type Context } from 'hono';
import { Webhooks } from '@polar-sh/hono';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { authenticateRequest } from './src/server/auth.js';
import {
  ensureUserOnboarded,
  getExportCapacity,
  isUnlimitedUser,
  releaseExportReservation,
  reservationOperationSchema,
  reservationRequestSchema,
  reserveExportCredits,
  settleExportReservation,
  type ReservationResult,
} from './src/server/credits.js';
import {
  checkoutRequestSchema,
  createPolarCheckout,
  getPurchaseHistory,
  processPolarWebhook,
} from './src/server/polar.js';
import {
  canAccessPrivateShare,
  getUserDesignStatus,
  getShareModerationFields,
  isExploreEligibleShare,
  isPrivateShare,
  isShareVisibility,
} from './src/server/share.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const cacheDelete = (identifier: string) => {
  identifierCache.delete(identifier);
};

// Serve static files from public or dist folders (used by local dev + fallback for production)
app.get('/*', async (c, next) => {
  const reqPath = c.req.path;

  // Skip rendering routes and API proxy routes
  if (
    reqPath === '/' ||
    reqPath === '/studio' ||
    reqPath === '/pricing' ||
    reqPath === '/terms' ||
    reqPath === '/privacy' ||
    reqPath === '/refund-policy' ||
    reqPath === '/faq' ||
    reqPath === '/explore' ||
    reqPath === '/purchases' ||
    reqPath === '/designs' ||
    reqPath.startsWith('/api/')
  ) {
    return await next();
  }

  const cleanPath = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
  const candidatePaths = [
    path.join(process.cwd(), 'public', cleanPath),
    path.join(process.cwd(), 'dist', cleanPath),
    path.resolve(__dirname, 'public', cleanPath),
    path.resolve(__dirname, 'dist', cleanPath),
  ];

  let targetPath: string | null = null;
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        targetPath = p;
        break;
      }
    } catch {
      // ignore filesystem errors
    }
  }

  if (targetPath) {
    const content = fs.readFileSync(targetPath);
    const ext = path.extname(targetPath).toLowerCase();
    let mime = 'application/octet-stream';
    if (ext === '.js' || ext === '.mjs') mime = 'application/javascript';
    else if (ext === '.css') mime = 'text/css';
    else if (ext === '.svg') mime = 'image/svg+xml';
    else if (ext === '.json') mime = 'application/json';
    else if (ext === '.png') mime = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
    else if (ext === '.gif') mime = 'image/gif';
    else if (ext === '.ico') mime = 'image/x-icon';
    else if (ext === '.webp') mime = 'image/webp';
    else if (ext === '.woff2') mime = 'font/woff2';
    else if (ext === '.woff') mime = 'font/woff';
    else if (ext === '.ttf') mime = 'font/ttf';
    else if (ext === '.mp4') mime = 'video/mp4';
    else if (ext === '.webm') mime = 'video/webm';

    const headers: Record<string, string> = {
      'Content-Type': mime,
    };
    if (reqPath.startsWith('/assets/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    return c.body(content, 200, headers);
  }

  await next();
});

// Inertia HTML Page Renderer
const renderInertiaPage = (componentName: string, props = {}, search = '') => {
  const baseUrl =
    {
      Home: '/',
      Studio: '/studio',
      Pricing: '/pricing',
      Faq: '/faq',
      Explore: '/explore',
      Purchases: '/purchases',
      Designs: '/designs',
      Terms: '/terms',
      Privacy: '/privacy',
      RefundPolicy: '/refund-policy',
    }[componentName] || '/';
  const pageData = JSON.stringify({
    component: componentName,
    props,
    url: baseUrl + search,
    version: null,
  });

  // Try to read the built index.html from dist/ and inject Inertia page data
  const possibleIndexPaths = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.resolve(__dirname, 'dist', 'index.html'),
    path.resolve(__dirname, '../dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
  ];
  const indexPath = possibleIndexPaths.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  if (indexPath) {
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

// Protected session probe used by the client and future credit endpoints.
// The browser SDK supplies the JWT; this server verifies it against Neon Auth's JWKS.
app.get('/api/auth/me', async (c) => {
  try {
    const user = await authenticateRequest(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await ensureUserOnboarded(user);
    const unlimited = isUnlimitedUser(user.id);
    c.header('Cache-Control', 'private, no-store');
    return c.json({
      user,
      credits: {
        balance: profile.creditsBalance,
        unlimited,
        exportCapacity: getExportCapacity(profile.creditsBalance),
      },
    });
  } catch (error) {
    console.error('Authenticated account setup failed:', error);
    return c.json({ error: 'Account setup is temporarily unavailable' }, 503);
  }
});

const reservationIdSchema = z.string().uuid();

function reservationResponse(result: ReservationResult, unlimited = false) {
  return {
    reservationId: result.reservationId,
    status: result.status,
    creditAmount: result.creditAmount,
    protectedRetry: result.protectedRetry,
    balance: result.balance,
    expiresAt: result.expiresAt,
    unlimited,
  };
}

function operationFailure(result: ReservationResult, requestId: string) {
  switch (result.resultCode) {
    case 'INSUFFICIENT_CREDITS':
      return {
        status: 409 as const,
        body: {
          error: {
            code: result.resultCode,
            message: `You need ${result.creditAmount} credits for this export.`,
            requestId,
            balance: result.balance,
          },
        },
      };
    case 'IDEMPOTENCY_CONFLICT':
      return {
        status: 409 as const,
        body: {
          error: {
            code: result.resultCode,
            message: 'That idempotency key was already used for a different operation.',
            requestId,
          },
        },
      };
    case 'INVALID_STATE':
      return {
        status: 409 as const,
        body: {
          error: {
            code: result.resultCode,
            message: `A ${result.status} reservation cannot perform this operation.`,
            requestId,
          },
        },
      };
    case 'ACCOUNT_IN_DEBT':
      return {
        status: 409 as const,
        body: {
          error: {
            code: result.resultCode,
            message: 'Exports are unavailable until the account credit debt is cleared.',
            requestId,
          },
        },
      };
    case 'TOO_MANY_OPEN_RESERVATIONS':
      return {
        status: 409 as const,
        body: {
          error: {
            code: result.resultCode,
            message: 'Finish or cancel an existing export before starting another.',
            requestId,
          },
        },
      };
    case 'NOT_FOUND':
      return {
        status: 404 as const,
        body: {
          error: {
            code: result.resultCode,
            message: 'Export reservation not found.',
            requestId,
          },
        },
      };
    default:
      return {
        status: 400 as const,
        body: {
          error: {
            code: result.resultCode,
            message: 'The credit operation could not be completed.',
            requestId,
          },
        },
      };
  }
}

app.get('/api/user/credits', async (c) => {
  const requestId = crypto.randomUUID();
  try {
    const user = await authenticateRequest(c.req.raw);
    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', requestId } },
        401
      );
    }

    const profile = await ensureUserOnboarded(user);
    const unlimited = isUnlimitedUser(user.id);
    c.header('Cache-Control', 'private, no-store');
    return c.json({
      balance: profile.creditsBalance,
      unlimited,
      currency: 'credits',
      updatedAt: profile.updatedAt,
      exportCapacity: getExportCapacity(profile.creditsBalance),
    });
  } catch (error) {
    console.error('Credit balance request failed:', requestId, error);
    return c.json(
      {
        error: {
          code: 'CREDITS_UNAVAILABLE',
          message: 'Your credit balance is temporarily unavailable.',
          requestId,
        },
      },
      503
    );
  }
});

app.get('/api/user/purchases', async (c) => {
  const requestId = crypto.randomUUID();
  try {
    const user = await authenticateRequest(c.req.raw);
    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', requestId } },
        401
      );
    }

    await ensureUserOnboarded(user);
    const purchases = await getPurchaseHistory(user.id);
    c.header('Cache-Control', 'private, no-store');
    return c.json({ purchases });
  } catch (error) {
    console.error('Purchase history request failed:', requestId, error);
    return c.json(
      {
        error: {
          code: 'PURCHASE_HISTORY_UNAVAILABLE',
          message: 'Your purchase history is temporarily unavailable.',
          requestId,
        },
      },
      503
    );
  }
});

app.post('/api/export/reservations', async (c) => {
  const requestId = crypto.randomUUID();
  try {
    const user = await authenticateRequest(c.req.raw);
    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', requestId } },
        401
      );
    }

    const parsed = reservationRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'The export reservation request is invalid.',
            requestId,
          },
        },
        400
      );
    }

    await ensureUserOnboarded(user);
    const unlimited = isUnlimitedUser(user.id);
    const result = await reserveExportCredits(user.id, parsed.data, unlimited);
    if (result.resultCode !== 'OK') {
      const failure = operationFailure(result, requestId);
      return c.json(failure.body, failure.status);
    }

    c.header('Cache-Control', 'private, no-store');
    return c.json(reservationResponse(result, unlimited), result.replayed ? 200 : 201);
  } catch (error) {
    console.error('Credit reservation failed:', requestId, error);
    return c.json(
      {
        error: {
          code: 'RESERVATION_UNAVAILABLE',
          message: 'The export reservation is temporarily unavailable.',
          requestId,
        },
      },
      503
    );
  }
});

const reservationOperationHandler = (operation: 'settle' | 'release') => async (c: Context) => {
  const requestId = crypto.randomUUID();
  try {
    const user = await authenticateRequest(c.req.raw);
    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', requestId } },
        401
      );
    }

    const reservationId = reservationIdSchema.safeParse(c.req.param('id'));
    const body = reservationOperationSchema.safeParse(await c.req.json().catch(() => null));
    if (!reservationId.success || !body.success) {
      return c.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'A valid reservation and idempotency key are required.',
            requestId,
          },
        },
        400
      );
    }

    await ensureUserOnboarded(user);
    const unlimited = isUnlimitedUser(user.id);
    const result =
      operation === 'settle'
        ? await settleExportReservation(user.id, reservationId.data, body.data.idempotencyKey)
        : await releaseExportReservation(user.id, reservationId.data, body.data.idempotencyKey);

    if (result.resultCode !== 'OK') {
      const failure = operationFailure(result, requestId);
      return c.json(failure.body, failure.status);
    }

    c.header('Cache-Control', 'private, no-store');
    return c.json(reservationResponse(result, unlimited));
  } catch (error) {
    console.error(`Credit reservation ${operation} failed:`, requestId, error);
    return c.json(
      {
        error: {
          code: 'RESERVATION_UNAVAILABLE',
          message: 'The export reservation is temporarily unavailable.',
          requestId,
        },
      },
      503
    );
  }
};

app.post('/api/export/reservations/:id/settle', reservationOperationHandler('settle'));
app.post('/api/export/reservations/:id/release', reservationOperationHandler('release'));

app.post('/api/checkout/create', async (c) => {
  const requestId = crypto.randomUUID();
  try {
    const user = await authenticateRequest(c.req.raw);
    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', requestId } },
        401
      );
    }

    const parsed = checkoutRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: 'INVALID_PACK',
            message: 'Choose a valid Shotage credit pack.',
            requestId,
          },
        },
        400
      );
    }

    await ensureUserOnboarded(user);
    const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    const customerIpAddress = c.req.header('cf-connecting-ip') || forwardedFor;
    const checkout = await createPolarCheckout(
      user,
      parsed.data.pack,
      c.req.url,
      customerIpAddress
    );
    c.header('Cache-Control', 'private, no-store');
    return c.json(checkout);
  } catch (error) {
    console.error('Polar checkout creation failed:', requestId, error);
    return c.json(
      {
        error: {
          code: 'CHECKOUT_UNAVAILABLE',
          message: 'Checkout is temporarily unavailable.',
          requestId,
        },
      },
      503
    );
  }
});

app.post('/api/webhooks/polar', async (c) => {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return c.json({ error: 'Polar webhook is not configured' }, 503);
  }

  return Webhooks({
    webhookSecret,
    onPayload: async (payload) => {
      const result = await processPolarWebhook(payload);
      console.info('Polar webhook processed:', payload.type, result.resultCode);
    },
  })(c);
});

// Fetch a shared design. The URL key is the identifier UUID (new links) or the
// entry id (legacy links). Resolves identifiers through a cached map.
app.get('/api/share/:id', async (c) => {
  const apiKey = process.env.MORPHIC_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Sharing is not configured yet' }, 500);
  }

  const cmsBase = process.env.MORPHIC_API_URL || 'https://main-workspace.morphic-cms.com';
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
  if (entry?.deletedAt || entry?.deleted_at) {
    return c.json({ error: 'Design not found' }, 404);
  }
  const content = entry?.content || entry;
  const jsonString = content?.json_string;
  if (!jsonString) {
    return c.json({ error: 'Design has no data' }, 404);
  }

  if (isPrivateShare(content)) {
    let user;
    try {
      user = await authenticateRequest(c.req.raw);
    } catch (error) {
      console.error('Private shared-design authentication failed:', error);
      return c.json({ error: 'Authentication is temporarily unavailable' }, 503);
    }
    if (!user) return c.json({ error: 'Sign in to view this private design' }, 401);
    if (!canAccessPrivateShare(content, user.id)) {
      return c.json({ error: 'You do not have access to this private design' }, 403);
    }
  }

  return c.json({
    name: content?.name || entry?.name || '',
    publisher: content?.publisher || entry?.publisher || '',
    identifier: content?.identifier || entry?.identifier || '',
    json_string: jsonString,
    is_in_review: content?.is_in_review || entry?.is_in_review || 'no',
    is_in_explore: content?.is_in_explore || entry?.is_in_explore || 'no',
    visibility: content?.visibility || entry?.visibility || 'public',
    user_id: content?.user_id || entry?.user_id || null,
    thumbnail: content?.thumbnail || entry?.thumbnail || null,
  });
});

// Share a design: verifies Cloudflare Turnstile, then stores in Morphic CMS.
// Creates a new entry on first share, updates the same entry on re-shares (dedup).
app.post('/api/share', async (c) => {
  let user;
  try {
    user = await authenticateRequest(c.req.raw);
  } catch (error) {
    console.error('Share authentication failed:', error);
    return c.json({ error: 'Authentication is temporarily unavailable' }, 503);
  }
  if (!user) return c.json({ error: 'Sign in to share a design' }, 401);

  const body = await c.req.json();
  const {
    name,
    publisher,
    identifier,
    json_string,
    visibility,
    turnstileToken,
    entryId,
    thumbnail,
  } = body || {};

  if (!name || !publisher || !identifier || !json_string) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  if (!isShareVisibility(visibility)) {
    return c.json({ error: 'Visibility must be private or public' }, 400);
  }
  if (entryId != null && !/^\d+$/.test(String(entryId))) {
    return c.json({ error: 'Invalid shared design id' }, 400);
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
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // Never trust an entry id from the browser without checking ownership first.
  // Entries created before account-linked sharing cannot be claimed implicitly.
  let isUpdate = Boolean(entryId);
  let resolvedIdentifier = identifier;
  if (isUpdate) {
    const existingRes = await fetch(`${cmsBase}/api/entries/${entryId}`, { headers });
    if (!existingRes.ok) {
      return c.json({ error: 'The shared design could not be found' }, 404);
    }
    const existingJson = await existingRes.json();
    const existingEntry = existingJson?.entry || existingJson?.data || existingJson;
    const existingContent = existingEntry?.content || existingEntry;
    if (!existingContent?.user_id) {
      // Legacy shares had no owner. Preserve the old entry and fork a new,
      // account-owned share with a fresh non-guessable URL.
      isUpdate = false;
      resolvedIdentifier = crypto.randomUUID();
    } else if (existingContent.user_id !== user.id) {
      return c.json({ error: 'You cannot update a design owned by another account' }, 403);
    }
  }

  // Upload thumbnail to Morphic CMS media endpoint if provided
  let thumbnailMedia: any = null;
  if (thumbnail && typeof thumbnail === 'string') {
    try {
      const match = thumbnail.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      let fileBlob: Blob;
      let fileName = `${resolvedIdentifier}.webp`;

      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType.includes('png')
          ? 'png'
          : mimeType.includes('jpeg') || mimeType.includes('jpg')
            ? 'jpg'
            : 'webp';
        fileName = `${resolvedIdentifier}.${ext}`;
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

  const moderation = getShareModerationFields(visibility);

  const payload = JSON.stringify({
    name,
    publisher,
    identifier: resolvedIdentifier,
    json_string,
    visibility,
    user_id: user.id,
    ...moderation,
    thumbnail: thumbnailMedia,
  });

  // Upsert: PUT to existing entry when entryId is provided, otherwise POST to create
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
  let createdId: string | null = isUpdate ? entryId : null;
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
  if (createdId) cacheSet(resolvedIdentifier, createdId);
  return c.json({
    url: `${origin}/studio?s=${resolvedIdentifier}`,
    identifier: resolvedIdentifier,
    entryId: createdId,
    visibility,
    reviewStatus: visibility === 'public' ? 'pending' : 'not_submitted',
  });
});

// List only the authenticated user's Morphic-backed designs. Canvas JSON is
// intentionally omitted so this lightweight account page cannot expose or
// download another part of the design payload accidentally.
app.get('/api/user/designs', async (c) => {
  const requestId = crypto.randomUUID();
  try {
    const user = await authenticateRequest(c.req.raw);
    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', requestId } },
        401
      );
    }

    const apiKey = process.env.MORPHIC_API_KEY;
    if (!apiKey) {
      return c.json(
        {
          error: {
            code: 'DESIGNS_NOT_CONFIGURED',
            message: 'Design storage is not configured.',
            requestId,
          },
        },
        503
      );
    }

    const cmsBase = process.env.MORPHIC_API_URL || 'https://main-workspace.morphic-cms.com';
    const response = await fetch(
      `${cmsBase}/api/collections/shotage-shareables/entries?page=1&limit=1000`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!response.ok) throw new Error(`Morphic returned HTTP ${response.status}`);

    const payload = await response.json();
    const entries = Array.isArray(payload?.entries)
      ? payload.entries
      : Array.isArray(payload)
        ? payload
        : [];
    const designs = entries
      .filter((item: any) => {
        const entry = item?.entry || item?.data || item;
        const content = entry?.content || entry;
        return (
          !entry?.deletedAt &&
          !entry?.deleted_at &&
          content?.user_id === user.id &&
          Boolean(content?.identifier)
        );
      })
      .map((item: any) => {
        const entry = item?.entry || item?.data || item;
        const content = entry?.content || entry;
        const thumbnail = content?.thumbnail;
        return {
          id: String(entry?.id),
          name: content?.name || 'Untitled design',
          publisher: content?.publisher || '',
          identifier: content.identifier,
          visibility: content?.visibility === 'private' ? 'private' : 'public',
          status: getUserDesignStatus(content),
          thumbnailUrl:
            thumbnail?.secureUrl ||
            thumbnail?.secure_url ||
            (typeof thumbnail === 'string' ? thumbnail : null),
          createdAt: entry?.createdAt || entry?.created_at || null,
          updatedAt: entry?.updatedAt || entry?.updated_at || null,
        };
      })
      .sort((a: any, b: any) => {
        const aTime = Date.parse(a.updatedAt || a.createdAt || '') || 0;
        const bTime = Date.parse(b.updatedAt || b.createdAt || '') || 0;
        return bTime - aTime;
      });

    c.header('Cache-Control', 'private, no-store');
    return c.json({ designs });
  } catch (error) {
    console.error('User designs request failed:', requestId, error);
    return c.json(
      {
        error: {
          code: 'DESIGNS_UNAVAILABLE',
          message: 'Your designs are temporarily unavailable.',
          requestId,
        },
      },
      503
    );
  }
});

app.delete('/api/user/designs/:id', async (c) => {
  const requestId = crypto.randomUUID();
  try {
    const user = await authenticateRequest(c.req.raw);
    if (!user) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', requestId } },
        401
      );
    }

    const entryId = c.req.param('id');
    if (!/^\d+$/.test(entryId)) {
      return c.json(
        { error: { code: 'INVALID_DESIGN_ID', message: 'Invalid design id.', requestId } },
        400
      );
    }

    const apiKey = process.env.MORPHIC_API_KEY;
    if (!apiKey) {
      return c.json(
        {
          error: {
            code: 'DESIGNS_NOT_CONFIGURED',
            message: 'Design storage is not configured.',
            requestId,
          },
        },
        503
      );
    }

    const cmsBase = process.env.MORPHIC_API_URL || 'https://main-workspace.morphic-cms.com';
    const headers = { Authorization: `Bearer ${apiKey}` };
    const existingResponse = await fetch(`${cmsBase}/api/entries/${entryId}`, { headers });
    if (existingResponse.status === 404) {
      return c.json(
        { error: { code: 'DESIGN_NOT_FOUND', message: 'Design not found.', requestId } },
        404
      );
    }
    if (!existingResponse.ok) throw new Error(`Morphic returned HTTP ${existingResponse.status}`);

    const existingPayload = await existingResponse.json();
    const entry = existingPayload?.entry || existingPayload?.data || existingPayload;
    const content = entry?.content || entry;
    if (content?.user_id !== user.id) {
      return c.json(
        {
          error: {
            code: 'DESIGN_FORBIDDEN',
            message: 'You cannot delete a design owned by another account.',
            requestId,
          },
        },
        403
      );
    }

    const deleteResponse = await fetch(`${cmsBase}/api/entries/${entryId}`, {
      method: 'DELETE',
      headers,
    });
    if (!deleteResponse.ok) throw new Error(`Morphic returned HTTP ${deleteResponse.status}`);

    if (content?.identifier) cacheDelete(content.identifier);
    c.header('Cache-Control', 'private, no-store');
    return c.json({ deleted: true });
  } catch (error) {
    console.error('Delete user design failed:', requestId, error);
    return c.json(
      {
        error: {
          code: 'DESIGN_DELETE_FAILED',
          message: 'The design could not be moved to trash. Please try again.',
          requestId,
        },
      },
      503
    );
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
  const s = c.req.query('s');
  const search = s ? `?s=${encodeURIComponent(s as string)}` : '';
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Studio', props: {}, url: `/studio${search}` });
  }
  return c.html(renderInertiaPage('Studio', {}, search));
});

app.get('/pricing', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Pricing', props: {}, url: '/pricing' });
  }
  return c.html(renderInertiaPage('Pricing'));
});

app.get('/terms', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Terms', props: {}, url: '/terms' });
  }
  return c.html(renderInertiaPage('Terms'));
});

app.get('/privacy', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Privacy', props: {}, url: '/privacy' });
  }
  return c.html(renderInertiaPage('Privacy'));
});

app.get('/refund-policy', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'RefundPolicy', props: {}, url: '/refund-policy' });
  }
  return c.html(renderInertiaPage('RefundPolicy'));
});

app.get('/faq', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Faq', props: {}, url: '/faq' });
  }
  return c.html(renderInertiaPage('Faq'));
});

app.get('/explore', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Explore', props: {}, url: '/explore' });
  }
  return c.html(renderInertiaPage('Explore'));
});

app.get('/purchases', (c) => {
  const search = new URL(c.req.url).search;
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Purchases', props: {}, url: `/purchases${search}` });
  }
  return c.html(renderInertiaPage('Purchases', {}, search));
});

app.get('/designs', (c) => {
  if (c.req.header('X-Inertia')) {
    c.header('X-Inertia', 'true');
    return c.json({ component: 'Designs', props: {}, url: '/designs' });
  }
  return c.html(renderInertiaPage('Designs'));
});

// Proxy endpoint to list explore entries from Morphic CMS
app.get('/api/explore', async (c) => {
  const apiKey = process.env.MORPHIC_API_KEY;
  const cmsBase = process.env.MORPHIC_API_URL || 'https://main-workspace.morphic-cms.com';
  const headers: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  try {
    const res = await fetch(
      `${cmsBase}/api/collections/shotage-shareables/entries?page=1&limit=1000`,
      { headers }
    );
    if (!res.ok) {
      return c.json(
        { error: 'Failed to fetch explore entries', status: res.status },
        res.status as any
      );
    }
    const data = await res.json();
    const entries = Array.isArray(data?.entries) ? data.entries : Array.isArray(data) ? data : [];
    const publicEntries = entries.filter((item: any) => {
      const entry = item?.entry || item?.data || item;
      const content = entry?.content || entry;
      return !entry?.deletedAt && !entry?.deleted_at && isExploreEligibleShare(content);
    });
    return c.json(Array.isArray(data) ? publicEntries : { ...data, entries: publicEntries });
  } catch (err) {
    console.error('Error fetching explore entries from Morphic CMS:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Export default Hono app for Vercel & Vite dev server
export default app;
