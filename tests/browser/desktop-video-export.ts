import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { BufferTarget, CanvasSource, Mp4OutputFormat, Output } from 'mediabunny';
import { VideoCanvasScreen, activeVideoDecoders } from '../../src/components/VideoCanvasScreen';
import { DesktopVideoExportSession, ExportVideoDecoder } from '../../src/utils/exportVideoDecoder';
import { captureDesktopVideoFrame } from '../../src/utils/desktopVideoCapture';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { convertAvcAnnexB } from '../../src/utils/avcAnnexB';

// This isolated test page never opens the Studio store or makes account/API calls.
// Run with scripts/test-desktop-video-export.swift against a local Vite server.
Object.assign(window, { isTauri: true });
const report = (message: Record<string, unknown>) => {
  document.querySelector('#results')!.textContent += `${JSON.stringify(message)}\n`;
  (window as any).webkit?.messageHandlers.report.postMessage(JSON.stringify(message));
};
const sourceFps = 30;
const sourceSeconds = 12;
// A real black interval must survive unchanged; no heuristic may replace it.
const color = (frame: number) =>
  frame >= 90 && frame < 120
    ? [0, 0, 0]
    : [50 + (frame % 150), 75 + (Math.floor(frame / 2) % 150), 120 + (frame % 110)];
const pixel = (canvas: HTMLCanvasElement, x = canvas.width / 2, y = canvas.height / 2) =>
  Array.from(
    canvas.getContext('2d', { willReadFrequently: true })!.getImageData(x, y, 1, 1).data
  ).slice(0, 3);
const closeColor = (actual: number[], expected: number[], where: string) => {
  if (actual.some((value, i) => Math.abs(value - expected[i]) > 22)) {
    throw new Error(`${where}: expected ${expected}, got ${actual}`);
  }
};
const expected = (time: number) => color(Math.floor(((time % sourceSeconds) + 1e-6) * sourceFps));

async function encoder(canvas: HTMLCanvasElement, fps: number) {
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat(), target });
  const source = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: 2_000_000,
    keyFrameInterval: 2,
  });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();
  return { target, output, source };
}

// Exercise Shotage's desktop Annex B conversion and MP4 muxer as well as the
// decoded/captured pixels. This is the same encoding format used by ExportModal.
function desktopEncoder(canvas: HTMLCanvasElement, fps: number) {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: canvas.width, height: canvas.height },
    fastStart: 'in-memory',
  });
  const config: VideoEncoderConfig = {
    codec: 'avc1.640033',
    width: canvas.width,
    height: canvas.height,
    bitrate: 10_000_000,
    avc: { format: 'annexb' },
  };
  let description: Uint8Array | null = null;
  let failure: unknown;
  const encoder = new VideoEncoder({
    output(chunk, metadata) {
      try {
        const bytes = new Uint8Array(chunk.byteLength);
        chunk.copyTo(bytes);
        const converted = convertAvcAnnexB(bytes);
        description = converted.decoderDescription || description;
        if (!description) throw new Error('Missing AVC configuration');
        muxer.addVideoChunkRaw(
          converted.sample,
          chunk.type,
          chunk.timestamp,
          chunk.duration ?? Math.round(1_000_000 / fps),
          {
            ...metadata,
            decoderConfig: {
              codec: config.codec,
              codedWidth: canvas.width,
              codedHeight: canvas.height,
              ...metadata?.decoderConfig,
              description: description.buffer,
            },
          }
        );
      } catch (error) {
        failure = error;
      }
    },
    error(error) {
      failure = error;
    },
  });
  encoder.configure(config);
  return {
    async add(frame: number) {
      if (failure) throw failure;
      const sample = new VideoFrame(canvas, {
        timestamp: Math.round((frame / fps) * 1_000_000),
        alpha: 'discard',
      });
      encoder.encode(sample, { keyFrame: frame % (fps * 2) === 0 });
      sample.close();
      if (encoder.encodeQueueSize > (fps === 60 ? 12 : 6)) await encoder.flush();
    },
    async finish() {
      await encoder.flush();
      if (failure) throw failure;
      muxer.finalize();
      return target.buffer;
    },
    close() {
      if (encoder.state !== 'closed') encoder.close();
    },
  };
}

async function run() {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = 1920;
  sourceCanvas.height = 1080;
  const context = sourceCanvas.getContext('2d')!;
  const generated = await encoder(sourceCanvas, sourceFps);
  for (let frame = 0; frame < sourceSeconds * sourceFps; frame++) {
    context.fillStyle = `rgb(${color(frame).join(',')})`;
    context.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    context.fillStyle = 'white';
    context.fillRect((frame * 4) % 1700, 30, 80, 80);
    await generated.source.add(frame / sourceFps, 1 / sourceFps);
  }
  generated.source.close();
  await generated.output.finalize();
  const url = URL.createObjectURL(new Blob([generated.target.buffer!], { type: 'video/mp4' }));
  const root = createRoot(document.querySelector('#root')!);
  const stageStyle = {
    width: 420,
    height: 160,
    display: 'flex',
    gap: 30,
    padding: 20,
    background: '#152436',
    boxSizing: 'border-box',
  } as const;
  const mockupStyle = {
    width: 175,
    height: 120,
    flexShrink: 0,
    borderRadius: 18,
    overflow: 'hidden',
    background: 'black',
    boxShadow: '0 8px 12px #0008',
  } as const;
  let rendered = 0;
  try {
    for (const test of [
      { name: '12s-first-export', fps: 30, frames: 360, density: 1, tilt: false, start: 0 },
      { name: '12s-repeat-2x-tilted', fps: 30, frames: 360, density: 2, tilt: true, start: 0 },
      { name: '60fps-source-loop', fps: 60, frames: 240, density: 1, tilt: true, start: 10 },
    ]) {
      const session = new DesktopVideoExportSession(test.fps);
      const composed = document.createElement('canvas');
      composed.width = 420 * test.density;
      composed.height = 160 * test.density;
      const output = desktopEncoder(composed, test.fps);
      const times: number[][] = [];
      try {
        const renderStage = (isExporting: boolean) =>
          flushSync(() =>
            root.render(
              React.createElement(
                'div',
                { id: 'stage', style: stageStyle },
                ...[1, 2].map((slotIndex) =>
                  React.createElement(
                    'div',
                    {
                      key: slotIndex,
                      'data-video-export-mockup': slotIndex,
                      style: {
                        ...mockupStyle,
                        transform: test.tilt
                          ? 'perspective(600px) rotateX(12deg) rotateY(-8deg)'
                          : 'none',
                      },
                    },
                    React.createElement(VideoCanvasScreen, {
                      src: url,
                      slotIndex,
                      isExporting,
                      isPlaying: !isExporting,
                      style: { width: '100%', height: '100%', objectFit: 'cover' },
                    })
                  )
                )
              )
            )
          );
        renderStage(false);
        await new Promise((resolve) => setTimeout(resolve, 150));
        renderStage(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        const stage = document.querySelector<HTMLElement>('#stage')!;
        const decoders = [...activeVideoDecoders.values()].filter(({ canvas }) =>
          stage.contains(canvas)
        );
        if (decoders.length !== 2) throw new Error('Two mockup slots did not initialize.');
        for (let frame = 0; frame < test.frames; frame++) {
          const slotTimes = [test.start + frame / test.fps, test.start + frame / test.fps + 2];
          times.push(slotTimes);
          for (let index = 0; index < decoders.length; index++) {
            const item = decoders[index];
            const timing = await session.paint(item.canvas, item.src, slotTimes[index]);
            closeColor(
              pixel(item.canvas),
              expected(slotTimes[index]),
              `${test.name} extracted ${frame}/${index} at ${timing.decodedTime}`
            );
            await item.prepareCaptureFrame();
          }
          const captured = await captureDesktopVideoFrame(stage, { pixelRatio: test.density });
          for (let index = 0; index < 2; index++) {
            closeColor(
              pixel(captured, (107 + index * 205) * test.density, 80 * test.density),
              expected(slotTimes[index]),
              `${test.name} snapshot ${frame}/${index}`
            );
          }
          composed.getContext('2d')!.drawImage(captured, 0, 0);
          captured.width = captured.height = 0;
          await output.add(frame);
          rendered++;
          if (frame % 120 === 0) report({ progress: test.name, frame, rendered });
        }
        const buffer = await output.finish();
        const resultUrl = URL.createObjectURL(new Blob([buffer], { type: 'video/mp4' }));
        const verify = await ExportVideoDecoder.open(resultUrl, test.fps);
        const decoded = document.createElement('canvas');
        try {
          for (let frame = 0; frame < test.frames; frame++) {
            await verify.paint(decoded, frame / test.fps);
            for (let index = 0; index < 2; index++) {
              closeColor(
                pixel(decoded, (107 + index * 205) * test.density, 80 * test.density),
                expected(times[frame][index]),
                `${test.name} encoded ${frame}/${index}`
              );
            }
          }
        } finally {
          await verify.dispose();
          URL.revokeObjectURL(resultUrl);
          decoded.width = decoded.height = 0;
        }
        report({ passed: test.name, frames: test.frames });
      } finally {
        output.close();
        await session.dispose();
        composed.width = composed.height = 0;
      }
    }
    report({
      done: true,
      passed: true,
      rendered,
      checks: rendered * 6,
      userAgent: navigator.userAgent,
    });
  } finally {
    root.unmount();
    URL.revokeObjectURL(url);
    sourceCanvas.width = sourceCanvas.height = 0;
  }
}
run().catch((error) =>
  report({ done: true, passed: false, error: String(error), stack: error.stack })
);
