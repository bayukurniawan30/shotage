import { describe, expect, it } from 'vitest';
import { getPatternSvgUrl, PATTERN_PRESETS } from './patternPresets';

describe('pattern presets', () => {
  it('includes a repeating horizontal and vertical square grid', () => {
    const squareGrid = PATTERN_PRESETS.find((preset) => preset.id === 'pattern-9');

    expect(squareGrid?.name).toBe('Square Grid');
    expect(getPatternSvgUrl('pattern-9', '#ffffff')).toContain("d='M0.5 0V32M0 0.5H32'");
  });
});
