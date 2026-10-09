import { describe, it, expect } from 'vitest';
import type { Font } from 'fontkit';
import type { TextLayer } from '../../types/studio';
import { outlineText, textOutlineRestriction, resolveOutlineFontVariant } from '../textToPath';
import { getStudioFont, GOOGLE_FONTS } from '../fontLoader';
import { ringsToMultiPolygon, parseSvgPathToRings, booleanOperationOnShapes } from '../shapeBoolean';

const text: TextLayer = {
  id: 't',
  text: 'O',
  fontFamily: 'Inter',
  fontSize: 100,
  fontWeight: '400',
  fontStyle: 'normal',
  color: '#fff',
  textAlign: 'left',
  x: 30,
  y: 40,
  shadow: false,
  opacity: 100,
  rotation: 0,
  position: 'above',
};
const font = {
  unitsPerEm: 1000,
  ascent: 800,
  descent: -200,
  layout: () => ({
    glyphs: [
      {
        id: 1,
        path: {
          commands: [
            { command: 'moveTo', args: [0, 0] },
            { command: 'lineTo', args: [600, 0] },
            { command: 'lineTo', args: [600, 700] },
            { command: 'lineTo', args: [0, 700] },
            { command: 'closePath', args: [] },
            { command: 'moveTo', args: [100, 100] },
            { command: 'lineTo', args: [100, 600] },
            { command: 'lineTo', args: [500, 600] },
            { command: 'lineTo', args: [500, 100] },
            { command: 'closePath', args: [] },
          ],
        },
      },
    ],
    positions: [{ xAdvance: 600, xOffset: 0, yOffset: 0 }],
  }),
} as unknown as Font;

describe('text outlines', () => {
  it('uses supported font variants instead of requesting nonexistent weights', () => {
    expect(resolveOutlineFontVariant(getStudioFont('Oswald')!, 900, false)).toEqual({
      family: 'Oswald:wght@700',
      weight: 700,
    });
    expect(resolveOutlineFontVariant(getStudioFont('Pacifico')!, 700, false)).toEqual({
      family: 'Pacifico',
      weight: 400,
    });
    expect(resolveOutlineFontVariant(getStudioFont('Dosis')!, 900, false)).toEqual({
      family: 'Dosis:wght@800',
      weight: 800,
    });
    expect(resolveOutlineFontVariant(getStudioFont('Lora')!, 800, true)).toEqual({
      family: 'Lora:ital,wght@1,700',
      weight: 700,
    });
    expect(() => resolveOutlineFontVariant(getStudioFont('Oswald')!, 700, true)).toThrow('italic');
    for (const entry of GOOGLE_FONTS)
      expect(resolveOutlineFontVariant(entry, 900, false).family).not.toContain('..');
  });
  it('preserves box, position, rotation and styling', () => {
    const shape = outlineText({ ...text, rotation: 25 }, font, 60, 120);
    expect(shape).toMatchObject({
      width: 60,
      height: 120,
      x: 30,
      y: 40,
      rotation: 25,
      color: '#fff',
      shapeType: 'custom-path',
    });
    expect(ringsToMultiPolygon(parseSvgPathToRings(shape.pathData!))).toHaveLength(1);
    expect(ringsToMultiPolygon(parseSvgPathToRings(shape.pathData!))[0]).toHaveLength(2);
  });
  it('retains glyph holes through union', () => {
    const shape = outlineText(text, font, 60, 120);
    const other = { ...shape, id: 'other', x: 500 };
    const union = booleanOperationOnShapes([shape, other], 'union')!;
    expect(ringsToMultiPolygon(parseSvgPathToRings(union.pathData!)).map((p) => p.length)).toEqual([
      2, 2,
    ]);
  });
  it('bakes stretch while keeping the anchor fixed', () => {
    expect(outlineText({ ...text, scaleX: 2, scaleY: 0.5 }, font, 60, 120)).toMatchObject({
      width: 120,
      height: 60,
      x: 0,
      y: 70,
    });
  });
  it('blocks destructive conversion of unsupported effects', () => {
    expect(textOutlineRestriction({ ...text, bgImage: 'test' })).toBeTruthy();
    expect(textOutlineRestriction({ ...text, yaw: 20 })).toBeTruthy();
    expect(textOutlineRestriction(text)).toBeNull();
  });
});
