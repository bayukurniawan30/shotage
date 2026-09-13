import React, { useState } from 'react';
import { CheckCircle, Loading01, Stars02 } from '@untitledui/icons';
import { AuthButton } from '../components/auth/AuthButton';
import { authClient, getAuthToken } from '../lib/auth/client';

const scopeLabels: Record<string, string> = {
  'designs:read': 'View your saved Shotage designs',
  'designs:write': 'Create and update your saved designs',
  'gradients:read': 'View Shotage gradient and Flow presets',
  'explore:submit': 'Submit a design for review in Explore',
};

export default function McpAuthorize() {
  const session = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = new URLSearchParams(window.location.search);
  const scopes = (params.get('scope') || 'designs:read designs:write gradients:read explore:submit')
    .split(/\s+/)
    .filter(Boolean);

  const approve = async () => {
    setPending(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/oauth/authorize?${params.toString()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.redirect)
        throw new Error(result?.error_description || 'Could not connect this client.');
      window.location.assign(result.redirect);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not connect this client.');
      setPending(false);
    }
  };

  const deny = () => {
    const redirectUri = params.get('redirect_uri');
    if (!redirectUri) return;
    const target = new URL(redirectUri);
    target.searchParams.set('error', 'access_denied');
    const state = params.get('state');
    if (state) target.searchParams.set('state', state);
    window.location.assign(target.toString());
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffafcc]/10 text-[#ffafcc] ring-1 ring-[#ffafcc]/25">
            <Stars02 className="h-6 w-6" />
          </div>
          <AuthButton compact />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Connect to Shotage</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Allow your MCP client to work with saved designs in your Shotage account. It cannot
          control a canvas that is already open.
        </p>
        <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          {scopes.map((scope) => (
            <div key={scope} className="flex gap-3 text-sm text-slate-300">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{scopeLabels[scope] || scope}</span>
            </div>
          ))}
        </div>
        {!session.data?.user && (
          <p className="mt-5 rounded-xl bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-200">
            Sign in above first, then approve the connection.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={deny}
            className="h-11 flex-1 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={approve}
            disabled={!session.data?.user || pending}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending && <Loading01 className="h-4 w-4 animate-spin" />} Connect
          </button>
        </div>
        <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
          You can remove the connection from the MCP client at any time. Morphic credentials always
          remain on the Shotage server.
        </p>
      </section>
    </main>
  );
}
