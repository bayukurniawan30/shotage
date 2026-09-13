import { and, eq, gt, isNull } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import type { AuthUser } from './auth.js';
import { getDatabase, schema } from './db/index.js';

export const MCP_SCOPES = [
  'designs:read',
  'designs:write',
  'gradients:read',
  'explore:submit',
] as const;
export type McpScope = (typeof MCP_SCOPES)[number];

const DEFAULT_SCOPES: McpScope[] = [
  'designs:read',
  'designs:write',
  'gradients:read',
  'explore:submit',
];

export class OAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export function getMcpIssuer(requestUrl: string) {
  const configured = (process.env.MCP_ISSUER_URL || process.env.APP_URL)?.trim();
  return (configured || new URL(requestUrl).origin).replace(/\/$/, '');
}

export function getMcpResource(requestUrl: string) {
  return `${getMcpIssuer(requestUrl)}/mcp`;
}

export function normalizeMcpScopes(value?: string | null): McpScope[] {
  if (!value?.trim()) return [...DEFAULT_SCOPES];
  const requested = [...new Set(value.trim().split(/\s+/))];
  const invalid = requested.filter((scope) => !MCP_SCOPES.includes(scope as McpScope));
  if (invalid.length)
    throw new OAuthError('invalid_scope', `Unsupported scope: ${invalid.join(', ')}`);
  return requested as McpScope[];
}

export function hasMcpScope(scopes: readonly string[], required: McpScope) {
  return scopes.includes(required);
}

function signingSecret() {
  const value = process.env.MCP_TOKEN_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error('MCP_TOKEN_SECRET must contain at least 32 characters');
  }
  return new TextEncoder().encode(value);
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Buffer.from(digest).toString('base64url');
}

function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return Buffer.from(value).toString('base64url');
}

function validRedirectUri(value: string) {
  try {
    const url = new URL(value);
    return (
      !url.hash &&
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    );
  } catch {
    return false;
  }
}

export async function registerOAuthClient(input: unknown) {
  const body = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((value): value is string => typeof value === 'string')
    : [];
  if (!redirectUris.length || redirectUris.some((uri) => !validRedirectUri(uri))) {
    throw new OAuthError('invalid_redirect_uri', 'Provide at least one HTTPS redirect URI.');
  }
  const clientId = randomToken(24);
  const clientName =
    typeof body.client_name === 'string' && body.client_name.trim()
      ? body.client_name.trim().slice(0, 120)
      : 'MCP client';
  await getDatabase().insert(schema.oauthClients).values({ clientId, clientName, redirectUris });
  return {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  };
}

export type AuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
  scope: McpScope[];
  resource: string;
};

export async function validateAuthorizationRequest(
  params: URLSearchParams,
  requestUrl: string
): Promise<AuthorizationRequest> {
  const clientId = params.get('client_id') || '';
  const redirectUri = params.get('redirect_uri') || '';
  const codeChallenge = params.get('code_challenge') || '';
  if (params.get('response_type') !== 'code')
    throw new OAuthError('unsupported_response_type', 'Only authorization code is supported.');
  if (params.get('code_challenge_method') !== 'S256' || !codeChallenge)
    throw new OAuthError('invalid_request', 'PKCE with S256 is required.');
  const [client] = await getDatabase()
    .select()
    .from(schema.oauthClients)
    .where(eq(schema.oauthClients.clientId, clientId))
    .limit(1);
  if (!client || !client.redirectUris.includes(redirectUri))
    throw new OAuthError('invalid_request', 'Unknown client or redirect URI.');
  const expectedResource = getMcpResource(requestUrl);
  const resource = params.get('resource') || expectedResource;
  if (resource !== expectedResource)
    throw new OAuthError(
      'invalid_target',
      'The requested resource is not this Shotage MCP server.'
    );
  return {
    clientId,
    redirectUri,
    codeChallenge,
    state: params.get('state') || undefined,
    scope: normalizeMcpScopes(params.get('scope')),
    resource,
  };
}

export async function issueAuthorizationCode(user: AuthUser, request: AuthorizationRequest) {
  const code = randomToken();
  await getDatabase()
    .insert(schema.oauthAuthorizationCodes)
    .values({
      codeHash: await sha256(code),
      clientId: request.clientId,
      userId: user.id,
      redirectUri: request.redirectUri,
      scope: request.scope.join(' '),
      resource: request.resource,
      codeChallenge: request.codeChallenge,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
  const redirect = new URL(request.redirectUri);
  redirect.searchParams.set('code', code);
  if (request.state) redirect.searchParams.set('state', request.state);
  return redirect.toString();
}

async function createAccessToken(
  userId: string,
  clientId: string,
  scopes: string[],
  resource: string,
  issuer: string
) {
  return new SignJWT({ scope: scopes.join(' '), client_id: clientId })
    .setProtectedHeader({ alg: 'HS256', typ: 'at+jwt' })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(resource)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(signingSecret());
}

async function persistRefreshToken(
  userId: string,
  clientId: string,
  scopes: string[],
  resource: string
) {
  const token = randomToken(48);
  await getDatabase()
    .insert(schema.oauthRefreshTokens)
    .values({
      tokenHash: await sha256(token),
      clientId,
      userId,
      scope: scopes.join(' '),
      resource,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000),
    });
  return token;
}

export async function exchangeAuthorizationCode(form: URLSearchParams, requestUrl: string) {
  const code = form.get('code') || '';
  const clientId = form.get('client_id') || '';
  const redirectUri = form.get('redirect_uri') || '';
  const verifier = form.get('code_verifier') || '';
  const codeHash = await sha256(code);
  const [record] = await getDatabase()
    .select()
    .from(schema.oauthAuthorizationCodes)
    .where(
      and(
        eq(schema.oauthAuthorizationCodes.codeHash, codeHash),
        eq(schema.oauthAuthorizationCodes.clientId, clientId),
        eq(schema.oauthAuthorizationCodes.redirectUri, redirectUri),
        isNull(schema.oauthAuthorizationCodes.consumedAt),
        gt(schema.oauthAuthorizationCodes.expiresAt, new Date())
      )
    )
    .limit(1);
  if (!record || (await sha256(verifier)) !== record.codeChallenge)
    throw new OAuthError('invalid_grant', 'The authorization code or PKCE verifier is invalid.');
  const consumed = await getDatabase()
    .update(schema.oauthAuthorizationCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(schema.oauthAuthorizationCodes.codeHash, codeHash),
        isNull(schema.oauthAuthorizationCodes.consumedAt)
      )
    )
    .returning({ codeHash: schema.oauthAuthorizationCodes.codeHash });
  if (!consumed.length)
    throw new OAuthError('invalid_grant', 'The authorization code was already used.');
  const scopes = normalizeMcpScopes(record.scope);
  const issuer = getMcpIssuer(requestUrl);
  return {
    access_token: await createAccessToken(record.userId, clientId, scopes, record.resource, issuer),
    token_type: 'Bearer',
    expires_in: 3600,
    scope: scopes.join(' '),
    refresh_token: await persistRefreshToken(record.userId, clientId, scopes, record.resource),
  };
}

export async function exchangeRefreshToken(form: URLSearchParams, requestUrl: string) {
  const token = form.get('refresh_token') || '';
  const clientId = form.get('client_id') || '';
  const tokenHash = await sha256(token);
  const [record] = await getDatabase()
    .select()
    .from(schema.oauthRefreshTokens)
    .where(
      and(
        eq(schema.oauthRefreshTokens.tokenHash, tokenHash),
        eq(schema.oauthRefreshTokens.clientId, clientId),
        isNull(schema.oauthRefreshTokens.revokedAt),
        gt(schema.oauthRefreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  if (!record) throw new OAuthError('invalid_grant', 'The refresh token is invalid or expired.');
  const original = normalizeMcpScopes(record.scope);
  const requested = form.get('scope') ? normalizeMcpScopes(form.get('scope')) : original;
  if (requested.some((scope) => !original.includes(scope)))
    throw new OAuthError('invalid_scope', 'A refresh cannot add scopes.');
  return {
    access_token: await createAccessToken(
      record.userId,
      clientId,
      requested,
      record.resource,
      getMcpIssuer(requestUrl)
    ),
    token_type: 'Bearer',
    expires_in: 3600,
    scope: requested.join(' '),
  };
}

export type McpPrincipal = { user: AuthUser; scopes: McpScope[]; clientId: string };

export async function authenticateMcpRequest(request: Request): Promise<McpPrincipal | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    const issuer = getMcpIssuer(request.url);
    const { payload } = await jwtVerify(authorization.slice(7).trim(), signingSecret(), {
      issuer,
      audience: getMcpResource(request.url),
      requiredClaims: ['sub', 'exp', 'scope', 'client_id'],
    });
    if (!payload.sub || typeof payload.scope !== 'string' || typeof payload.client_id !== 'string')
      return null;
    return {
      user: { id: payload.sub, email: null, name: null, image: null },
      scopes: normalizeMcpScopes(payload.scope),
      clientId: payload.client_id,
    };
  } catch {
    return null;
  }
}
