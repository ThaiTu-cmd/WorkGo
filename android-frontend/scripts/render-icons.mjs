// Renders the WorkGo mark (assets/brand/workgo-mark.svg) into the PNGs that
// app.config.ts points at. Run with `npm run icons` after changing the mark.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => join(root, 'assets', 'images', name);
const GREEN = '#1dbf73';

const svg = await readFile(join(root, 'assets', 'brand', 'workgo-mark.svg'), 'utf8');
// The "W" alone, for layers that bring their own background.
const glyph = svg.replace(/<rect[^>]*\/>/, '');
const whiteGlyph = Buffer.from(glyph);
const blackGlyph = Buffer.from(glyph.replace('#ffffff', '#000000'));

// Adaptive-icon foreground: glyph inside the 66% safe zone on transparency.
async function safeZone(glyphSvg, size) {
  const inner = Math.round(size * 0.66);
  const art = await sharp(glyphSvg).resize(inner, inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: 'center' }])
    .png();
}

await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(out('icon.png'));
await (await safeZone(whiteGlyph, 1024)).toFile(out('android-icon-foreground.png'));
await (await safeZone(blackGlyph, 1024)).toFile(out('android-icon-monochrome.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: GREEN } }).png().toFile(out('android-icon-background.png'));
await sharp(whiteGlyph).resize(512, 512).png().toFile(out('splash-icon.png'));
await sharp(Buffer.from(svg)).resize(48, 48).png().toFile(out('favicon.png'));

console.log('Icons written to assets/images/');
