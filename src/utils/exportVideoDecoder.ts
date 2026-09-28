import { ALL_FORMATS, Input, UrlSource, VideoSampleSink, type VideoSample } from 'mediabunny';

// Resolve output timestamps onto the source timeline, including repeated clips.
// Use integer frame indices upstream to avoid accumulated floating-point drift.
export function sourceVideoTimestamp(timeSec: number, start: number, end: number) {
  const duration = end - start;
  if (!Number.isFinite(timeSec) || !Number.isFinite(duration) || duration <= 0) {
    throw new Error('The uploaded video has an invalid duration or timestamp.');
  }
  const time = Math.max(0, timeSec);
  const remainder = time % duration;
  return start + (duration - remainder < 1e-7 ? 0 : remainder);
}

export interface DecodedExportFrame {
  requestedTime: number;
  sourceTime: number;
  decodedTime: number;
  duration: number;
}

/** An export owns its decoder. No HTMLVideoElement playback or paint callbacks. */
export class ExportVideoDecoder {
  private iterator: AsyncGenerator<VideoSample | null, void, unknown> | null = null;
  private nextTime: number | null = null;
  private disposed = false;

  private constructor(
    private input: Input,
    private sink: VideoSampleSink,
    private start: number,
    private end: number,
    private fps: number
  ) {}

  static async open(src: string, fps: number): Promise<ExportVideoDecoder> {
    if (!src || !Number.isFinite(fps) || fps <= 0) {
      throw new Error('The uploaded video export source or frame rate is invalid.');
    }
    const input = new Input({
      formats: ALL_FORMATS,
      source: new UrlSource(src, {
        maxCacheSize: 16 * 1024 * 1024,
        getRetryDelay: () => null,
      }),
    });
    try {
      const track = await input.getPrimaryVideoTrack();
      if (!track || !(await track.canDecode())) {
        throw new Error('This video cannot be decoded for desktop export. Try an H.264 MP4 file.');
      }
      const start = Math.max(0, await track.getFirstTimestamp());
      const end = await track.computeDuration();
      sourceVideoTimestamp(0, start, end);
      return new ExportVideoDecoder(input, new VideoSampleSink(track), start, end, fps);
    } catch (error) {
      input.dispose();
      throw error;
    }
  }

  private *timestamps(from: number) {
    for (let index = 0; !this.disposed; index++) {
      yield sourceVideoTimestamp(from + index / this.fps, this.start, this.end);
    }
  }

  async paint(canvas: HTMLCanvasElement, timeSec: number): Promise<DecodedExportFrame> {
    if (this.disposed) throw new Error('The video export decoder has been closed.');
    const sourceTime = sourceVideoTimestamp(timeSec, this.start, this.end);
    // Stage changes, transitions and repeated exports can jump backwards.
    if (!this.iterator || this.nextTime === null || Math.abs(timeSec - this.nextTime) > 1e-7) {
      await this.iterator?.return();
      this.iterator = this.sink.samplesAtTimestamps(this.timestamps(timeSec));
    }
    const { value: sample } = await this.iterator.next();
    this.nextTime = timeSec + 1 / this.fps;
    if (!sample) {
      throw new Error(`The uploaded video has no decoded frame at ${timeSec.toFixed(3)}s.`);
    }
    try {
      if (!sample.displayWidth || !sample.displayHeight) {
        throw new Error('The uploaded video returned an empty frame.');
      }
      if (canvas.width !== sample.displayWidth) canvas.width = sample.displayWidth;
      if (canvas.height !== sample.displayHeight) canvas.height = sample.displayHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare the uploaded video frame.');
      context.clearRect(0, 0, canvas.width, canvas.height);
      // Applies the source's rotation / display aspect metadata, too.
      sample.draw(context, 0, 0, canvas.width, canvas.height);
      return {
        requestedTime: timeSec,
        sourceTime,
        decodedTime: sample.timestamp,
        duration: sample.duration,
      };
    } finally {
      sample.close();
    }
  }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    try {
      await this.iterator?.return();
    } finally {
      this.iterator = null;
      this.input.dispose();
    }
  }
}

/** Keeps separate decoders for two slots and overlapping transition stages. */
export class DesktopVideoExportSession {
  private decoders = new Map<HTMLCanvasElement, { src: string; decoder: ExportVideoDecoder }>();

  constructor(private fps: number) {}

  async paint(canvas: HTMLCanvasElement, src: string, timeSec: number) {
    for (const [element, entry] of this.decoders) {
      if (!element.isConnected || (element === canvas && entry.src !== src)) {
        this.decoders.delete(element);
        await entry.decoder.dispose();
      }
    }
    let entry = this.decoders.get(canvas);
    if (!entry) {
      entry = { src, decoder: await ExportVideoDecoder.open(src, this.fps) };
      this.decoders.set(canvas, entry);
    }
    return entry.decoder.paint(canvas, timeSec);
  }

  async dispose() {
    const entries = [...this.decoders.values()];
    this.decoders.clear();
    await Promise.allSettled(entries.map(({ decoder }) => decoder.dispose()));
  }
}
