import React, { useEffect, useRef, useState } from 'react';
import { loadRemoteImage } from '../utils/remoteImage';

export function ImageFillUrlInput({ onApply }: { onApply: (source: string) => void }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const apply = async () => {
    if (loading || !url.trim()) return;
    const request = new AbortController();
    controller.current = request;
    const timeout = setTimeout(() => request.abort(), 15000);
    setLoading(true);
    setError('');
    try {
      const source = await loadRemoteImage(url, request.signal);
      onApply(source);
      setUrl('');
    } catch (e) {
      if (controller.current === request)
        setError(
          request.signal.aborted
            ? 'Image loading timed out. Please try again.'
            : e instanceof TypeError
              ? 'Unable to load this URL. The server may block external access (CORS). Try uploading the image instead.'
              : e instanceof Error
                ? e.message
                : 'Unable to load the image.'
        );
    } finally {
      clearTimeout(timeout);
      if (controller.current === request) {
        controller.current = null;
        setLoading(false);
      }
    }
  };
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] text-slate-400">
        Image URL
        <div className="mt-1 flex gap-2">
          <input
            type="url"
            value={url}
            disabled={loading}
            placeholder="https://example.com/image.png"
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void apply();
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-xs text-white"
          />
          <button
            type="button"
            disabled={loading || !url.trim()}
            onClick={() => void apply()}
            className="rounded-lg bg-pastel-pink px-3 text-xs font-semibold text-neutral-950 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            {loading ? 'Loading…' : 'Use image'}
          </button>
        </div>
      </label>
      {error && (
        <p role="alert" className="text-[11px] text-rose-400">
          {error}
        </p>
      )}
      <p className="text-[10px] text-slate-500">
        Direct image links only. A copy is saved with your design.
      </p>
    </div>
  );
}
