import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

let cachedJwksUrl: string | null = null;
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getAuthBaseUrl(): string | null {
  const value = (process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL)?.trim();
  return value || null;
}

export function resolveNeonAuthJwksUrl(authBaseUrl: string, configuredUrl?: string): string {
  const override = configuredUrl?.trim();
  if (override) return override;

  return new URL(
    '.well-known/jwks.json',
    authBaseUrl.endsWith('/') ? authBaseUrl : `${authBaseUrl}/`
  ).toString();
}

function getJwks() {
  const authBaseUrl = getAuthBaseUrl();
  if (!authBaseUrl) {
    throw new Error('Neon Auth is not configured');
  }

  const jwksUrl = resolveNeonAuthJwksUrl(authBaseUrl, process.env.NEON_AUTH_JWKS_URL);
  if (!cachedJwks || cachedJwksUrl !== jwksUrl) {
    cachedJwksUrl = jwksUrl;
    cachedJwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return cachedJwks;
}

function claimAsString(payload: JWTPayload, claim: string): string | null {
  const value = payload[claim];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function authenticateRequest(request: Request): Promise<AuthUser | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      requiredClaims: ['sub', 'exp'],
      clockTolerance: 5,
    });

    if (!payload.sub) return null;

    return {
      id: payload.sub,
      email: claimAsString(payload, 'email'),
      name: claimAsString(payload, 'name'),
      image: claimAsString(payload, 'picture') || claimAsString(payload, 'image'),
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Neon Auth is not configured') {
      throw error;
    }
    return null;
  }
}
