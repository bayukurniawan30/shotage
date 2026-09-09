import { describe, expect, it } from 'vitest';
import {
  getExportCapacity,
  getImageExportCost,
  getVideoExportCost,
  isUnlimitedUser,
  reservationOperationSchema,
  reservationRequestSchema,
} from './credits';

describe('isUnlimitedUser', () => {
  it('matches exact, comma-separated user profile IDs', () => {
    expect(isUnlimitedUser('user-two', ' user-one, user-two ,user-three ')).toBe(true);
    expect(isUnlimitedUser('user', 'user-one,user-two')).toBe(false);
  });

  it('defaults to metered access when the allowlist is empty', () => {
    expect(isUnlimitedUser('user-one', '')).toBe(false);
    expect(isUnlimitedUser('user-one', ' , ')).toBe(false);
  });
});

describe('getExportCapacity', () => {
  it('calculates whole exports from the available balance', () => {
    expect(getExportCapacity(100)).toEqual({
      standardImages: 6,
      fourKImages: 3,
      shortVideos: 1,
      longVideos: 0,
    });
  });

  it('never counts a partial export', () => {
    expect(getExportCapacity(14)).toEqual({
      standardImages: 0,
      fourKImages: 0,
      shortVideos: 0,
      longVideos: 0,
    });
  });
});

describe('getImageExportCost', () => {
  it('prices standard and high-density image exports per stage', () => {
    expect(getImageExportCost(1)).toBe(15);
    expect(getImageExportCost(2, 3)).toBe(45);
    expect(getImageExportCost(3)).toBe(30);
    expect(getImageExportCost(4, 2)).toBe(60);
  });
});

describe('getVideoExportCost', () => {
  it('prices short and long videos by their combined duration', () => {
    expect(getVideoExportCost(10)).toBe(75);
    expect(getVideoExportCost(10.001)).toBe(120);
    expect(getVideoExportCost(30)).toBe(120);
  });
});

describe('credit API validation', () => {
  const common = {
    idempotencyKey: '8d4bc1e2-da8b-46f0-9b70-244f8363cc61',
    projectHash: 'a'.repeat(64),
    scale: 2,
    stageScope: 'current' as const,
    stageCount: 1,
  };

  it('accepts supported image and video reservations', () => {
    expect(
      reservationRequestSchema.safeParse({
        ...common,
        kind: 'image',
        format: 'png',
        videoDurationSeconds: null,
      }).success
    ).toBe(true);
    expect(
      reservationRequestSchema.safeParse({
        ...common,
        kind: 'video',
        format: 'mp4',
        videoDurationSeconds: 10,
      }).success
    ).toBe(true);
  });

  it('rejects invalid hashes, formats, durations, and operation keys', () => {
    expect(
      reservationRequestSchema.safeParse({
        ...common,
        projectHash: 'not-a-hash',
        kind: 'image',
        format: 'mp4',
      }).success
    ).toBe(false);
    expect(
      reservationRequestSchema.safeParse({
        ...common,
        kind: 'video',
        format: 'webm',
        videoDurationSeconds: 31,
      }).success
    ).toBe(false);
    expect(reservationOperationSchema.safeParse({ idempotencyKey: 'reused' }).success).toBe(false);
  });
});
