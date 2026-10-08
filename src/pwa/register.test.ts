import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerPwa } from './register';

afterEach(() => vi.unstubAllGlobals());

function setup(controlled = true) {
  const events: Record<string, () => void> = {};
  const nodes: Array<any> = [];
  const postMessage = vi.fn();
  const reg = {
    waiting: { postMessage },
    installing: null,
    update: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
  };
  const workers = {
    controller: controlled ? {} : null,
    register: vi.fn().mockResolvedValue(reg),
    addEventListener: vi.fn((event: string, handler: () => void) => {
      events[event] = handler;
    }),
  };
  const reload = vi.fn();
  const append = vi.fn();
  vi.stubGlobal('navigator', { serviceWorker: workers });
  vi.stubGlobal('window', { location: { reload } });
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    body: { append },
    addEventListener: vi.fn(),
    createElement: (tag: string) => {
      const node = {
        tag,
        textContent: '',
        append: vi.fn(),
        setAttribute: vi.fn(),
        remove: vi.fn(),
        onclick: () => {},
        disabled: false,
      };
      nodes.push(node);
      return node;
    },
  });
  return { events, nodes, reg, workers, reload, append, postMessage };
}

describe('PWA update consent', () => {
  it('shows an existing waiting update but does not activate or reload automatically', async () => {
    const s = setup();
    await registerPwa();
    expect(s.workers.register).toHaveBeenCalledWith('/pwa-worker.js', { updateViaCache: 'none' });
    expect(s.append).toHaveBeenCalledOnce();
    expect(s.postMessage).not.toHaveBeenCalled();
    s.events.controllerchange();
    expect(s.reload).not.toHaveBeenCalled();
  });
  it('activates on Reload, then reloads once when the controller changes', async () => {
    const s = setup();
    await registerPwa();
    s.nodes.find((n) => n.textContent === 'Reload').onclick();
    expect(s.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(s.reload).not.toHaveBeenCalled();
    s.events.controllerchange();
    s.events.controllerchange();
    expect(s.reload).toHaveBeenCalledOnce();
  });
  it('allows postponing without refreshing', async () => {
    const s = setup();
    await registerPwa();
    s.nodes.find((n) => n.textContent === 'Later').onclick();
    expect(s.nodes[0].remove).toHaveBeenCalledOnce();
    expect(s.postMessage).not.toHaveBeenCalled();
    expect(s.reload).not.toHaveBeenCalled();
  });
  it('does not show an update prompt on first install', async () => {
    const s = setup(false);
    await registerPwa();
    expect(s.append).not.toHaveBeenCalled();
    s.events.controllerchange();
    expect(s.reload).not.toHaveBeenCalled();
  });
});
