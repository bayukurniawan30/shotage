import type { Font } from 'fontkit';
import type { TextLayer, ShapeLayer } from '../types/studio';
import { getStudioFont, loadStudioFont } from './fontLoader';

export function textOutlineRestriction(layer: TextLayer): string | null {
  if (!layer.text.trim()) return 'Enter some text first.';
  if (layer.locked) return 'Unlock the text first.';
  if (layer.socialPlatform) return 'Social elements cannot be converted.';
  if (layer.bgImage) return 'Remove the text image fill before converting.';
  if (
    layer.keyframes?.length ||
    layer.motions?.length ||
    (layer.loopAnimation && layer.loopAnimation !== 'none')
  )
    return 'Remove text animation before converting to a static path.';
  if (layer.pitch || layer.yaw || layer.skewX || layer.skewY)
    return 'Reset pitch, yaw and skew before converting.';
  return null;
}

/** Pure outline layout; retains the text box so alignment and transform origin do not jump. */
export function outlineText(
  layer: TextLayer,
  font: Font,
  width: number,
  height: number
): ShapeLayer {
  const scale = layer.fontSize / font.unitsPerEm;
  const lineHeight = layer.fontSize * 1.2;
  const baseline = (lineHeight - (font.ascent - font.descent) * scale) / 2 + font.ascent * scale;
  const commands: string[] = [];
  const unitCommands: string[] = [];
  const spacing = layer.letterSpacing ?? 0;
  const sx = layer.scaleX ?? 1;
  const sy = layer.scaleY ?? 1;
  const names = {
    moveTo: 'M',
    lineTo: 'L',
    quadraticCurveTo: 'Q',
    bezierCurveTo: 'C',
    closePath: 'Z',
  };
  for (const [lineIndex, line] of layer.text.split('\n').entries()) {
    const run = font.layout(line, spacing ? { liga: false, clig: false } : undefined);
    if (run.glyphs.some((g) => g.id === 0))
      throw new Error('This font does not contain every character. Choose another font.');
    const lineWidth = run.positions.reduce((sum, p) => sum + p.xAdvance * scale + spacing, 0);
    let cursor =
      layer.textAlign === 'right'
        ? width - lineWidth
        : layer.textAlign === 'center'
          ? (width - lineWidth) / 2
          : 0;
    run.glyphs.forEach((glyph, i) => {
      const pos = run.positions[i];
      for (const cmd of glyph.path.commands) {
        const args = cmd.args.map((n, j) =>
          j % 2 === 0
            ? (cursor + (n + pos.xOffset) * scale) * sx
            : (baseline + lineIndex * lineHeight - (n + pos.yOffset) * scale) * sy
        );
        commands.push(`${names[cmd.command]} ${args.join(' ')}`);
        unitCommands.push(
          `${names[cmd.command]} ${args.map((n, j) => n / (j % 2 === 0 ? width * sx : height * sy)).join(' ')}`
        );
      }
      cursor += pos.xAdvance * scale + spacing;
    });
  }
  if (!commands.length) throw new Error('No vector outlines were found in this text.');
  return {
    id: `text-outline-${crypto.randomUUID()}`,
    shapeType: 'custom-path',
    pathClosed: true,
    name: `${layer.name || layer.text} (Outline)`,
    pathData: commands.join(' '),
    unitPathData: unitCommands.join(' '),
    viewBox: `0 0 ${width * sx} ${height * sy}`,
    width: width * sx,
    height: height * sy,
    x: layer.x + width * (layer.anchorX ?? 0.5) * (1 - sx),
    y: layer.y + height * (layer.anchorY ?? 0.5) * (1 - sy),
    rotation: layer.rotation,
    anchorX: layer.anchorX,
    anchorY: layer.anchorY,
    color: layer.color,
    gradient: layer.gradient,
    opacity: layer.opacity,
    position: layer.position,
    visible: layer.visible,
    shadow: layer.shadow,
    blur: layer.blur,
    shadowOpacity: layer.shadowOpacity,
    shadowBlur: layer.shadowBlur,
    shadowOffsetX: layer.shadowOffsetX,
    shadowOffsetY: layer.shadowOffsetY,
    borderEnabled: false,
    borderRadius: 0,
  };
}

export async function convertTextToPath(layer: TextLayer): Promise<ShapeLayer> {
  const restriction = textOutlineRestriction(layer);
  if (restriction) throw new Error(restriction);
  const entry = getStudioFont(layer.fontFamily);
  if (!entry) throw new Error('Choose a supported Google Font before converting.');
  await loadStudioFont(entry.name);
  await document.fonts.ready;
  const element = document.querySelector<HTMLElement>(
    `.text-layer-item[data-layer-id="${CSS.escape(layer.id)}"]`
  );
  if (!element) throw new Error('The text must be visible on the canvas before converting.');
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (!width || !height) throw new Error('Unable to measure the text.');
  const family = entry.name.replace(/ /g, '+');
  const axis =
    layer.fontStyle === 'italic' ? `ital,wght@1,${layer.fontWeight}` : `wght@${layer.fontWeight}`;
  // Never send the user's text to Google; only request the font family and variant.
  const response = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:${axis}&display=swap`
  );
  if (!response.ok)
    throw new Error('Unable to load this font weight/style. Choose a supported variant.');
  const css = await response.text();
  const { create } = await import('fontkit');
  const urls = [
    ...new Set(
      [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1])
    ),
  ].reverse();
  for (const url of urls) {
    const file = await fetch(url);
    if (!file.ok) throw new Error('Unable to download font outlines. Please try again.');
    let font = create(new Uint8Array(await file.arrayBuffer()) as Parameters<typeof create>[0]);
    if (!('layout' in font)) continue;
    if (font.variationAxes?.wght) font = font.getVariation({ wght: Number(layer.fontWeight) });
    if (
      [...layer.text]
        .filter((c) => c !== '\n')
        .every((c) => font.hasGlyphForCodePoint(c.codePointAt(0)!))
    )
      return outlineText(layer, font, width, height);
  }
  throw new Error(
    'No single font subset contains all characters. Mixed-script or emoji text cannot be converted yet.'
  );
}
