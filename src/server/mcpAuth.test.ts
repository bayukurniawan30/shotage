import { describe, expect, it } from 'vitest';
import { hasMcpScope, normalizeMcpScopes, OAuthError, sha256 } from './mcpAuth';

describe('MCP OAuth helpers', () => {
  it('uses the complete default scope set', () => {
    expect(normalizeMcpScopes()).toEqual([
      'designs:read',
      'designs:write',
      'gradients:read',
      'explore:submit',
    ]);
  });

  it('deduplicates scopes and rejects unknown scopes', () => {
    expect(normalizeMcpScopes('designs:read designs:read gradients:read')).toEqual([
      'designs:read',
      'gradients:read',
    ]);
    expect(() => normalizeMcpScopes('admin')).toThrow(OAuthError);
  });

  it('produces the RFC 7636 S256 representation', async () => {
    expect(await sha256('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    );
  });

  it('checks scopes exactly', () => {
    expect(hasMcpScope(['designs:read'], 'designs:read')).toBe(true);
    expect(hasMcpScope(['designs:read'], 'designs:write')).toBe(false);
  });
});
