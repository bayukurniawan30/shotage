export async function registerPwa() {
  const workers = navigator.serviceWorker;
  let reloadRequested = false;
  let refreshing = false;
  let banner: HTMLElement | null = null;
  workers.addEventListener('controllerchange', () => {
    // First install and updates accepted by another tab must not interrupt editing.
    if (reloadRequested && !refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
  const reg = await workers.register('/pwa-worker.js', { updateViaCache: 'none' });
  const showUpdate = () => {
    if (banner || !workers.controller || !reg.waiting) return;
    banner = document.createElement('aside');
    banner.setAttribute('role', 'status');
    banner.className =
      'fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-[250] max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-sm text-white shadow-2xl';
    const message = document.createElement('p');
    message.textContent = 'Update available. Save your design before reloading.';
    const actions = document.createElement('div');
    actions.className = 'mt-3 flex gap-3';
    const reload = document.createElement('button');
    reload.type = 'button';
    reload.className =
      'rounded-lg bg-pastel-pink px-4 py-2 font-semibold text-neutral-950 cursor-pointer';
    reload.textContent = 'Reload';
    reload.onclick = () => {
      reloadRequested = true;
      const waiting = reg.waiting;
      if (waiting) {
        reload.disabled = true;
        reload.textContent = 'Updating…';
        waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    };
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'px-3 py-2 text-neutral-300 cursor-pointer';
    later.textContent = 'Later';
    later.onclick = () => {
      banner?.remove();
      banner = null;
    };
    actions.append(reload, later);
    banner.append(message, actions);
    document.body.append(banner);
  };
  const watchInstalling = () => {
    const installing = reg.installing;
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed') showUpdate();
    });
  };
  reg.addEventListener('updatefound', watchInstalling);
  watchInstalling();
  showUpdate();
  const check = () =>
    reg.update().catch((error) => console.warn('PWA update check failed:', error));
  void check();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      showUpdate();
      void check();
    }
  });
}
