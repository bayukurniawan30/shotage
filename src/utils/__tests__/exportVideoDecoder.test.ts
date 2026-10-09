import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dispose: vi.fn(),
  close: vi.fn(),
  draw: vi.fn(),
  requested: [] as number[],
  starts: 0,
  returns: 0,
  canDecode: true,
}));

vi.mock('mediabunny', () => ({
  ALL_FORMATS: [],
  UrlSource: class {},
  Input: class {
    dispose = mocks.dispose;
    getPrimaryVideoTrack = async () => ({
      canDecode: async () => mocks.canDecode,
      getFirstTimestamp: async () => 0.1,
      computeDuration: async () => 2.1,
    });
  },
  VideoSampleSink: class {
    async *samplesAtTimestamps(times: Iterable<number>) {
      mocks.starts++;
      try {
        for (const time of times) {
          mocks.requested.push(time);
          yield {
            displayWidth: 160,
            displayHeight: 90,
            timestamp: time,
            duration: 1 / 30,
            draw: mocks.draw,
            close: mocks.close,
          };
        }
      } finally {
        mocks.returns++;
      }
    }
  },
}));

import {
  DesktopVideoExportSession,
  ExportVideoDecoder,
  sourceVideoTimestamp,
} from '../exportVideoDecoder';

const canvas = () =>
  ({
    width: 0,
    height: 0,
    isConnected: true,
    getContext: () => ({ clearRect: vi.fn() }),
  }) as unknown as HTMLCanvasElement;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requested = [];
  mocks.starts = 0;
  mocks.returns = 0;
  mocks.canDecode = true;
});

describe('export video timeline', () => {
  it('keeps the first frame, respects a non-zero track start, and loops precisely', () => {
    expect(sourceVideoTimestamp(0, 0.1, 2.1)).toBe(0.1);
    expect(sourceVideoTimestamp(1.5, 0.1, 2.1)).toBe(1.6);
    expect(sourceVideoTimestamp(2, 0.1, 2.1)).toBe(0.1);
    expect(sourceVideoTimestamp(1.9999999999, 0.1, 2.1)).toBe(0.1);
    expect(() => sourceVideoTimestamp(0, 0, 0)).toThrow();
    expect(() => sourceVideoTimestamp(NaN, 0, 2)).toThrow();
  });

  it('streams sequential frames without recreating the decoder, including a loop', async () => {
    const decoder = await ExportVideoDecoder.open('blob:clip', 30);
    const target = canvas();
    for (let frame = 0; frame < 90; frame++) await decoder.paint(target, frame / 30);
    expect(mocks.starts).toBe(1);
    expect(mocks.requested[0]).toBe(0.1);
    expect(mocks.requested[60]).toBe(0.1);
    expect(mocks.close).toHaveBeenCalledTimes(90);
    expect([target.width, target.height]).toEqual([160, 90]);
    await decoder.dispose();
    await decoder.dispose();
    expect(mocks.returns).toBe(1);
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
    await expect(decoder.paint(target, 0)).rejects.toThrow('closed');
  });

  it('restarts iteration for stage rewinds and releases the prior iterator', async () => {
    const decoder = await ExportVideoDecoder.open('blob:clip', 60);
    await decoder.paint(canvas(), 1);
    await decoder.paint(canvas(), 1 + 1 / 60);
    await decoder.paint(canvas(), 0);
    expect(mocks.starts).toBe(2);
    expect(mocks.returns).toBe(1);
    expect(mocks.requested.at(-1)).toBe(0.1);
    await decoder.dispose();
  });

  it('closes decoded frames even if canvas painting fails', async () => {
    mocks.draw.mockImplementationOnce(() => {
      throw new Error('paint failed');
    });
    const decoder = await ExportVideoDecoder.open('blob:clip', 30);
    await expect(decoder.paint(canvas(), 0)).rejects.toThrow('paint failed');
    expect(mocks.close).toHaveBeenCalledTimes(1);
    await decoder.dispose();
  });

  it('cleans up an unsupported input instead of falling back to playback capture', async () => {
    mocks.canDecode = false;
    await expect(ExportVideoDecoder.open('blob:clip', 30)).rejects.toThrow('H.264 MP4');
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
  });

  it('isolates concurrent slots and replaces decoders after source/stage changes', async () => {
    const session = new DesktopVideoExportSession(30);
    const first = canvas();
    const second = canvas();
    await Promise.all([session.paint(first, 'blob:a', 0), session.paint(second, 'blob:a', 1)]);
    expect(mocks.starts).toBe(2);
    await session.paint(first, 'blob:b', 0);
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
    Object.assign(second, { isConnected: false });
    await session.paint(first, 'blob:b', 1 / 30);
    expect(mocks.dispose).toHaveBeenCalledTimes(2);
    await session.dispose();
    expect(mocks.dispose).toHaveBeenCalledTimes(3);
  });
});
