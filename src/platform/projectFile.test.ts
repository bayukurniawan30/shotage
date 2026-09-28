import { describe, expect, it } from 'vitest';
import { DEFAULT_STUDIO_STATE } from '../types/studio';
import { createProjectFile, parseProjectFile } from './projectFile';

describe('Shotage desktop project files', () => {
  it('round trips a single-stage design without losing source code settings', () => {
    const state = {
      ...DEFAULT_STUDIO_STATE,
      frameType: 'code-window' as const,
      codeSource: 'const shot = true;',
      codeWindowHeight: 100,
      stages: [],
    };
    const project = createProjectFile(state);
    const restored = parseProjectFile(JSON.stringify(project));

    expect(restored.format).toBe('shotage-project');
    expect(restored.studioState.frameType).toBe('code-window');
    expect(restored.studioState.codeSource).toBe('const shot = true;');
    expect(restored.studioState.codeWindowHeight).toBe(100);
    expect(restored.studioState.stages).toEqual([]);
  });

  it('rejects unsupported versions and incomplete designs', () => {
    const project = createProjectFile(DEFAULT_STUDIO_STATE);
    expect(() => parseProjectFile(JSON.stringify({ ...project, formatVersion: 2 }))).toThrow(
      'unsupported Shotage format version'
    );
    expect(() => parseProjectFile('{"frameType":"code-window"}')).toThrow(
      'missing required Studio fields'
    );
  });
});
