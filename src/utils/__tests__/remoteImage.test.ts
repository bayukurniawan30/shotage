import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadRemoteImage } from '../remoteImage';

afterEach(() => vi.unstubAllGlobals());
const signal = () => new AbortController().signal;
describe('image fill URL validation', () => {
  it('rejects invalid URLs and unsafe protocols before fetching', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    for (const url of [
      'not a url',
      'javascript:alert(1)',
      'file:///image.png',
      'data:image/png;base64,a',
    ]) {
      await expect(loadRemoteImage(url, signal())).rejects.toThrow();
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects a webpage even if its URL looks like an image', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('<html/>', { headers: { 'content-type': 'text/html' } }))
    );
    await expect(loadRemoteImage('https://example.com/image.png', signal())).rejects.toThrow(
      'does not return an image'
    );
  });
  it('rejects HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(loadRemoteImage('https://example.com/a.png', signal())).rejects.toThrow('404');
  });
  it('requires valid image bytes, not only an image MIME type', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('broken', { headers: { 'content-type': 'image/png' } }))
    );
    vi.stubGlobal(
      'FileReader',
      class {
        result = 'data:image/png;base64,broken';
        onload = () => {};
        readAsDataURL() {
          this.onload();
        }
      }
    );
    vi.stubGlobal(
      'Image',
      class {
        decode() {
          return Promise.reject(new Error('Invalid'));
        }
      }
    );
    await expect(loadRemoteImage('https://example.com/a.png', signal())).rejects.toThrow(
      'invalid or unsupported'
    );
  });
  it('returns a decoded local copy without sending credentials', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('valid', { headers: { 'content-type': 'image/png' } }));
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal(
      'FileReader',
      class {
        result = 'data:image/png;base64,valid';
        onload = () => {};
        readAsDataURL() {
          this.onload();
        }
      }
    );
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 100;
        naturalHeight = 100;
        decode() {
          return Promise.resolve();
        }
      }
    );
    const abort = signal();
    expect(await loadRemoteImage('https://example.com/a.png', abort)).toBe(
      'data:image/png;base64,valid'
    );
    expect(fetch).toHaveBeenCalledWith('https://example.com/a.png', {
      signal: abort,
      credentials: 'omit',
    });
  });
});
