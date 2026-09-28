import { describe, expect, it } from 'vitest';
import { getDesktopFrameExportIssue } from './desktopFrameCompatibility';
import type { StudioState } from '../types/studio';

const design = {
  frameType: 'iphone',
  activeStageIndex: 0,
  stages: [
    { frameType: 'iphone' },
    { frameType: 'iphone16-floating' },
    { frameType: 'code-window' },
  ],
} satisfies Pick<StudioState, 'frameType' | 'activeStageIndex' | 'stages'>;

describe('desktop frame export compatibility', () => {
  it('allows a supported current stage', () => {
    expect(getDesktopFrameExportIssue(design, 'current')).toBeNull();
  });

  it('flags an unsupported frame in another stage for all-stage export', () => {
    expect(getDesktopFrameExportIssue(design, 'all')).toContain('iPhone 16 Floating in Stage 2');
  });

  it('uses the live active-stage frame instead of a stale stage snapshot', () => {
    const activeDesign = { ...design, frameType: 'iphone16' as const };
    expect(getDesktopFrameExportIssue(activeDesign, 'current')).toContain('iPhone 16');
  });

  it('blocks existing mockup tilt and perspective values', () => {
    const tilted = { ...design, rotateY: 12, frameType: 'iphone' as const };
    expect(getDesktopFrameExportIssue(tilted, 'current')).toContain('mockup Pitch, Yaw, Skew');

    const perspective = { ...design, perspective: 750 };
    expect(getDesktopFrameExportIssue(perspective, 'current')).toContain('Perspective Depth');
  });

  it('blocks transforms on layers and animation keyframes in another stage', () => {
    const layered = {
      ...design,
      stages: [
        { frameType: 'iphone' as const },
        { frameType: 'iphone' as const, textLayers: [{ name: 'Headline', skewX: 10 }] as StudioState['textLayers'] },
      ],
    };
    expect(getDesktopFrameExportIssue(layered, 'all')).toContain('Headline in Stage 2');

    const animated = {
      ...design,
      keyframes: [{ rotateX: 15 }],
    };
    expect(getDesktopFrameExportIssue(animated, 'current')).toContain('mockup animation keyframe');
  });

  it('keeps ordinary 2D rotation exportable', () => {
    const rotated = { ...design, slot1Rotate: 30, shapeLayers: [{ name: 'Square', rotation: 45 }] };
    expect(getDesktopFrameExportIssue(rotated, 'current')).toBeNull();
  });

  it('ignores inactive second-slot tilt but blocks it in a two-slot layout', () => {
    const single = { ...design, layoutCount: 1 as const, slot2RotateY: 20 };
    expect(getDesktopFrameExportIssue(single, 'current')).toBeNull();
    const dual = { ...single, layoutCount: 2 as const };
    expect(getDesktopFrameExportIssue(dual, 'current')).toContain('mockup Pitch');
  });
});
