import { useEffect, useRef, useState } from 'react';
import type { Update } from '@tauri-apps/plugin-updater';
import { isDesktopApp } from '../../platform/runtime';
import { useStudioStore } from '../../store/useStudioStore';
import { saveSession } from '../../utils/sessionStore';

type UpdateView =
  | { kind: 'hidden' | 'checking' | 'current'; message?: string }
  | { kind: 'available'; version: string; notes?: string }
  | { kind: 'downloading'; percent: number | null; message: string }
  | { kind: 'error'; message: string };

export const CHECK_FOR_UPDATES_EVENT = 'shotage:check-for-updates';

export function DesktopUpdater() {
  const [view, setView] = useState<UpdateView>({ kind: 'hidden' });
  const updateRef = useRef<Update | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!isDesktopApp()) return;

    const checkForUpdates = async (manual: boolean) => {
      if (busyRef.current) return;
      if (import.meta.env.DEV) {
        if (manual) {
          setView({ kind: 'error', message: 'Update checks require a packaged desktop build.' });
        }
        return;
      }

      busyRef.current = true;
      if (manual) setView({ kind: 'checking' });
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check({ timeout: 15_000 });
        if (updateRef.current) await updateRef.current.close();
        updateRef.current = update;
        if (update) {
          setView({ kind: 'available', version: update.version, notes: update.body });
        } else if (manual) {
          setView({ kind: 'current' });
        }
      } catch (error) {
        console.warn('Shotage update check failed:', error);
        if (manual) {
          setView({
            kind: 'error',
            message: 'Could not check for updates. Check your connection or try again later.',
          });
        }
      } finally {
        busyRef.current = false;
      }
    };

    const onManualCheck = () => void checkForUpdates(true);
    window.addEventListener(CHECK_FOR_UPDATES_EVENT, onManualCheck);
    const timer = window.setTimeout(() => void checkForUpdates(false), 5_000);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CHECK_FOR_UPDATES_EVENT, onManualCheck);
    };
  }, []);

  if (!isDesktopApp() || view.kind === 'hidden') return null;

  const dismiss = () => {
    if (view.kind === 'downloading') return;
    if (updateRef.current) void updateRef.current.close();
    updateRef.current = null;
    setView({ kind: 'hidden' });
  };

  const install = async () => {
    const update = updateRef.current;
    if (!update || busyRef.current) return;
    busyRef.current = true;
    setView({ kind: 'downloading', percent: null, message: 'Preparing update…' });
    try {
      // Preserve the active Studio state before the updater can close the app
      // (Windows installers can exit it as soon as installation begins).
      await saveSession(useStudioStore.getState());
      let downloaded = 0;
      let total: number | undefined;
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength;
          setView({
            kind: 'downloading',
            percent: total ? 0 : null,
            message: 'Downloading update…',
          });
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          setView({
            kind: 'downloading',
            percent: total ? Math.min(100, Math.round((downloaded / total) * 100)) : null,
            message: 'Downloading update…',
          });
        } else {
          setView({ kind: 'downloading', percent: 100, message: 'Installing update…' });
        }
      });
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (error) {
      console.error('Shotage update failed:', error);
      setView({
        kind: 'error',
        message: 'The update could not be installed. Your design is safe; please try again later.',
      });
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Shotage desktop update"
    >
      <div className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-6 text-slate-100 shadow-2xl">
        <h2 className="text-lg font-bold">
          {view.kind === 'available'
            ? `Shotage ${view.version} is available`
            : view.kind === 'checking'
              ? 'Checking for updates…'
              : view.kind === 'downloading'
                ? 'Updating Shotage'
                : view.kind === 'current'
                  ? 'Shotage is up to date'
                  : 'Update check failed'}
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          {view.kind === 'available'
            ? 'Install the new version and relaunch Shotage. Your current design will be saved for recovery first.'
            : view.kind === 'downloading'
              ? view.message
              : view.kind === 'current'
                ? 'You are already using the latest available desktop version.'
                : view.kind === 'error'
                  ? view.message
                  : 'This should only take a moment.'}
        </p>
        {view.kind === 'available' && view.notes && (
          <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-neutral-800 p-3 text-xs text-neutral-300">
            {view.notes}
          </p>
        )}
        {view.kind === 'downloading' && (
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-700"
            role="progressbar"
            aria-valuenow={view.percent ?? undefined}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-pink-300 transition-[width]"
              style={{ width: `${view.percent ?? 8}%` }}
            />
          </div>
        )}
        {view.kind !== 'downloading' && view.kind !== 'checking' && (
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700"
            >
              {view.kind === 'available' ? 'Later' : 'Close'}
            </button>
            {view.kind === 'available' && (
              <button
                type="button"
                onClick={() => void install()}
                className="rounded-lg bg-pink-300 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-pink-200"
              >
                Update and restart
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
