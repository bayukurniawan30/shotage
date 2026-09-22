import { describe, expect, it } from 'vitest';
import { clampCodeSource, highlightSourceCode } from './codeHighlight';

describe('source code mockup highlighting', () => {
  it('produces safe highlighted markup for a supported language', async () => {
    const html = await highlightSourceCode(
      'const message: string = "<Shotage>";',
      'typescript',
      'dark'
    );
    expect(html).toContain('class="shiki');
    expect(html).toContain('Shotage');
    expect(html).not.toContain('<Shotage>');
  });

  it('caps pasted code by line count and serialized size', () => {
    expect(
      clampCodeSource(Array.from({ length: 600 }, (_, index) => `${index}`).join('\n')).split('\n')
    ).toHaveLength(500);
    expect(clampCodeSource('x'.repeat(40_000))).toHaveLength(30_000);
  });
});
