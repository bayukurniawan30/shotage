import { afterEach, describe, expect, it } from 'vitest';
import app from '../../index';
import { resolveNeonAuthJwksUrl } from './auth';

describe('resolveNeonAuthJwksUrl', () => {
  it('uses the managed Neon Auth JWKS endpoint', () => {
    expect(resolveNeonAuthJwksUrl('https://example.neonauth.test/neondb/auth')).toBe(
      'https://example.neonauth.test/neondb/auth/.well-known/jwks.json'
    );
  });

  it('allows the exact JWKS URL to be configured', () => {
    expect(
      resolveNeonAuthJwksUrl(
        'https://example.neonauth.test/neondb/auth',
        'https://keys.example.test/jwks.json'
      )
    ).toBe('https://keys.example.test/jwks.json');
  });
});

describe('GET /api/auth/me', () => {
  afterEach(() => {
    delete process.env.NEON_AUTH_BASE_URL;
  });

  it('rejects requests without a bearer token', async () => {
    const response = await app.request('/api/auth/me');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('rejects malformed bearer tokens', async () => {
    process.env.NEON_AUTH_BASE_URL = 'https://example.invalid';

    const response = await app.request('/api/auth/me', {
      headers: { Authorization: 'Bearer not-a-jwt' },
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });
});

describe('protected credit endpoints', () => {
  it.each([
    ['GET', '/api/user/credits'],
    ['GET', '/api/user/purchases'],
    ['GET', '/api/user/designs'],
    ['DELETE', '/api/user/designs/123'],
    ['POST', '/api/export/reservations'],
    ['POST', '/api/checkout/create'],
    ['POST', '/api/export/reservations/00000000-0000-4000-8000-000000000000/settle'],
    ['POST', '/api/export/reservations/00000000-0000-4000-8000-000000000000/release'],
  ])('rejects unauthenticated %s requests to %s', async (method, path) => {
    const response = await app.request(path, { method });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });
});

describe('POST /api/webhooks/polar', () => {
  it('fails closed when the webhook signing secret is missing', async () => {
    const previousSecret = process.env.POLAR_WEBHOOK_SECRET;
    delete process.env.POLAR_WEBHOOK_SECRET;

    try {
      const response = await app.request('/api/webhooks/polar', { method: 'POST' });
      expect(response.status).toBe(503);
    } finally {
      if (previousSecret) process.env.POLAR_WEBHOOK_SECRET = previousSecret;
    }
  });
});
