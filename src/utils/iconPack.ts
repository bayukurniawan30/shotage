export type IconPlatform = 'web' | 'android' | 'ios' | 'windows';
export type IconPackOptions = {
  platforms: IconPlatform[];
  name: string;
  shortName: string;
  startUrl: string;
  background: string;
  theme: string;
  padding: number;
  legacyTiles: boolean;
};
export type PackFile = { name: string; data: Uint8Array };
const encoder = new TextEncoder();

// Area-weighted sampling avoids dropping thin strokes when a large source is
// reduced to just a few pixels. Accumulate premultiplied color to avoid halos.
export function resampleIconPixels(
  source: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(width * height * 4);
  const scaleX = sourceWidth / width;
  const scaleY = sourceHeight / height;
  for (let y = 0; y < height; y++) {
    const top = y * scaleY,
      bottom = (y + 1) * scaleY;
    for (let x = 0; x < width; x++) {
      const left = x * scaleX,
        right = (x + 1) * scaleX;
      let alpha = 0,
        red = 0,
        green = 0,
        blue = 0;
      for (let sy = Math.floor(top); sy < Math.ceil(bottom); sy++) {
        const wy = Math.min(bottom, sy + 1) - Math.max(top, sy);
        for (let sx = Math.floor(left); sx < Math.ceil(right); sx++) {
          const weight = wy * (Math.min(right, sx + 1) - Math.max(left, sx));
          const index =
            (Math.min(sy, sourceHeight - 1) * sourceWidth + Math.min(sx, sourceWidth - 1)) * 4;
          const weightedAlpha = source[index + 3] * weight;
          alpha += weightedAlpha;
          red += source[index] * weightedAlpha;
          green += source[index + 1] * weightedAlpha;
          blue += source[index + 2] * weightedAlpha;
        }
      }
      const index = (y * width + x) * 4;
      if (alpha > 0) {
        output[index] = red / alpha;
        output[index + 1] = green / alpha;
        output[index + 2] = blue / alpha;
      }
      output[index + 3] = alpha / (scaleX * scaleY);
    }
  }
  return output;
}

export function renderIconCanvas(
  master: HTMLCanvasElement,
  width: number,
  height: number,
  background: string,
  padding: number
): HTMLCanvasElement {
  const makeCanvas = (w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create an icon canvas.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    return { canvas, ctx };
  };
  // Composite at master resolution, so background/padding are sampled together
  // with the artwork rather than painting a tiny, fractionally positioned logo.
  const scale = Math.max(1, Math.max(master.width, master.height) / Math.max(width, height));
  let { canvas, ctx } = makeCanvas(Math.round(width * scale), Math.round(height * scale));
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const side =
    Math.min(canvas.width, canvas.height) * (1 - Math.min(40, Math.max(0, padding)) / 50);
  ctx.drawImage(master, (canvas.width - side) / 2, (canvas.height - side) / 2, side, side);
  if (width === canvas.width && height === canvas.height) return canvas;
  if (Math.max(width, height) <= 64) {
    const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = makeCanvas(width, height);
    const pixels = result.ctx.createImageData(width, height);
    pixels.data.set(resampleIconPixels(source.data, canvas.width, canvas.height, width, height));
    result.ctx.putImageData(pixels, 0, 0);
    canvas.width = canvas.height = 0;
    return result.canvas;
  }
  // Larger icons use progressive reductions instead of one extreme resize.
  while (canvas.width > width * 2 && canvas.height > height * 2) {
    const next = makeCanvas(
      Math.max(width, Math.round(canvas.width / 2)),
      Math.max(height, Math.round(canvas.height / 2))
    );
    next.ctx.drawImage(canvas, 0, 0, next.canvas.width, next.canvas.height);
    canvas.width = canvas.height = 0;
    canvas = next.canvas;
    ctx = next.ctx;
  }
  const result = makeCanvas(width, height);
  result.ctx.drawImage(canvas, 0, 0, width, height);
  canvas.width = canvas.height = 0;
  return result.canvas;
}

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// STORE ZIP entries: PNG/ICO data is already compressed. No extra dependency
// or expensive second compression pass is needed.
export function createZip(files: PackFile[]): Blob {
  const parts: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array(30 + name.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x800, true);
    view.setUint16(12, 33, true); // 1980-01-01
    view.setUint32(14, crc, true);
    view.setUint32(18, file.data.length, true);
    view.setUint32(22, file.data.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(local, file.data);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x800, true);
    cv.setUint16(14, 33, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, file.data.length, true);
    cv.setUint32(24, file.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    directory.push(central);
    offset += local.length + file.data.length;
  }
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(
    12,
    directory.reduce((sum, part) => sum + part.length, 0),
    true
  );
  ev.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end] as BlobPart[], { type: 'application/zip' });
}

export function createIco(images: { size: number; data: Uint8Array }[]): Uint8Array {
  let offset = 6 + images.length * 16;
  const output = new Uint8Array(offset + images.reduce((sum, image) => sum + image.data.length, 0));
  const view = new DataView(output.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    output[entry] = output[entry + 1] = image.size === 256 ? 0 : image.size;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, image.data.length, true);
    view.setUint32(entry + 12, offset, true);
    output.set(image.data, offset);
    offset += image.data.length;
  });
  return output;
}

const iosSlots = [
  ['iphone', 20, 2],
  ['iphone', 20, 3],
  ['iphone', 29, 2],
  ['iphone', 29, 3],
  ['iphone', 40, 2],
  ['iphone', 40, 3],
  ['iphone', 60, 2],
  ['iphone', 60, 3],
  ['ipad', 20, 1],
  ['ipad', 20, 2],
  ['ipad', 29, 1],
  ['ipad', 29, 2],
  ['ipad', 40, 1],
  ['ipad', 40, 2],
  ['ipad', 76, 1],
  ['ipad', 76, 2],
  ['ipad', 83.5, 2],
  ['ios-marketing', 1024, 1],
] as const;

export async function generateIconPack(
  master: HTMLCanvasElement,
  options: IconPackOptions
): Promise<Blob> {
  if (!options.platforms.length) throw new Error('Select at least one platform.');
  if (!/^#[0-9a-f]{6}$/i.test(options.background) || !/^#[0-9a-f]{6}$/i.test(options.theme)) {
    throw new Error('Use six-digit hex colors.');
  }
  if (
    options.platforms.includes('web') &&
    (!options.startUrl.startsWith('/') || options.startUrl.startsWith('//'))
  ) {
    throw new Error('Start URL must be a site-relative path, such as / or /studio.');
  }
  const files: PackFile[] = [];
  const addText = (name: string, text: string) => files.push({ name, data: encoder.encode(text) });
  const png = async (width: number, height = width, padding = options.padding) => {
    const canvas = renderIconCanvas(master, width, height, options.background, padding);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Could not encode an icon.'))),
        'image/png'
      )
    );
    canvas.width = canvas.height = 0;
    return new Uint8Array(await blob.arrayBuffer());
  };
  const addPng = async (name: string, size: number, height = size, padding = options.padding) => {
    const data = await png(size, height, padding);
    files.push({ name, data });
    return data;
  };
  await addPng('app-icon-1024x1024.png', 1024);
  if (options.platforms.includes('web')) {
    const faviconImages = [];
    for (const size of [16, 32, 48])
      faviconImages.push({ size, data: await addPng(`web/favicon-${size}x${size}.png`, size) });
    files.push({ name: 'web/favicon.ico', data: createIco(faviconImages) });
    await addPng('web/apple-touch-icon-180x180.png', 180);
    for (const size of [192, 512]) {
      await addPng(`web/web-app-icon-${size}x${size}.png`, size);
      // Keep the entire square artwork inside the maskable safe circle (r=40%).
      await addPng(
        `web/web-app-icon-maskable-${size}x${size}.png`,
        size,
        size,
        Math.max(22, options.padding)
      );
    }
    addText(
      'web/manifest.json',
      JSON.stringify(
        {
          name: options.name || 'My App',
          short_name: options.shortName || options.name || 'My App',
          start_url: options.startUrl,
          scope: '/',
          display: 'standalone',
          background_color: options.background,
          theme_color: options.theme,
          icons: [192, 512].flatMap((size) => [
            {
              src: `web-app-icon-${size}x${size}.png`,
              sizes: `${size}x${size}`,
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `web-app-icon-maskable-${size}x${size}.png`,
              sizes: `${size}x${size}`,
              type: 'image/png',
              purpose: 'maskable',
            },
          ]),
        },
        null,
        2
      )
    );
    addText(
      'web/integration.html',
      '<!-- Copy web/ contents into your website root. -->\n<link rel="icon" href="/favicon.ico">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">\n<link rel="manifest" href="/manifest.json">\n' +
        `<meta name="theme-color" content="${options.theme}">`
    );
  }
  if (options.platforms.includes('android')) {
    for (const size of [48, 72, 96, 144, 192])
      await addPng(`android/android-icon-${size}x${size}.png`, size);
    await addPng('android/android-store-icon-512x512.png', 512);
  }
  if (options.platforms.includes('ios')) {
    const sizes = [...new Set(iosSlots.map(([, size, scale]) => size * scale))];
    for (const size of sizes)
      await addPng(`ios/AppIcon.appiconset/ios-icon-${size}x${size}.png`, size);
    addText(
      'ios/AppIcon.appiconset/Contents.json',
      JSON.stringify(
        {
          images: iosSlots.map(([idiom, size, scale]) => ({
            idiom,
            size: `${size}x${size}`,
            scale: `${scale}x`,
            filename: `ios-icon-${size * scale}x${size * scale}.png`,
          })),
          info: { version: 1, author: 'xcode' },
        },
        null,
        2
      )
    );
  }
  if (options.platforms.includes('windows')) {
    const images = [];
    for (const size of [16, 24, 32, 48, 64, 128, 256]) images.push({ size, data: await png(size) });
    files.push({ name: 'windows/windows-icon.ico', data: createIco(images) });
    if (options.legacyTiles) {
      for (const [width, height] of [
        [70, 70],
        [150, 150],
        [310, 150],
        [310, 310],
      ])
        await addPng(`windows/mstile-${width}x${height}.png`, width, height);
      addText(
        'windows/browserconfig.xml',
        `<?xml version="1.0" encoding="utf-8"?>\n<browserconfig><msapplication><tile><square70x70logo src="/mstile-70x70.png"/><square150x150logo src="/mstile-150x150.png"/><wide310x150logo src="/mstile-310x150.png"/><square310x310logo src="/mstile-310x310.png"/><TileColor>${options.background}</TileColor></tile></msapplication></browserconfig>`
      );
    }
  }
  addText(
    'README.txt',
    `Generated by Shotage Studio. One active stage, flat PNG icons.\n\nAll PNGs are flattened against your chosen background. Corners are not automatically rounded. Inspect small icons for legibility.\n\nWeb: copy web/ contents to your website root; add integration.html tags to your HTML head. Configure HTTPS and a service worker separately if your app requires one.\nAndroid: copy 48/72/96/144/192px files into mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi as ic_launcher.png. These are standard icons, not adaptive or monochrome layers. The 512px icon is for the store.\niOS/iPadOS: import AppIcon.appiconset into Assets.xcassets. These are traditional flat icons, not layered appearance variants.\nWindows: windows-icon.ico is a multi-size application icon. Optional mstile files/browserconfig.xml are legacy website assets, not native Windows tile packaging. Copy them to your site root and add <meta name="msapplication-config" content="/browserconfig.xml">.\n`
  );
  return createZip(files);
}
