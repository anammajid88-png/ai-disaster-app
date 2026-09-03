/**
 * Generates the PWA icons and the Open Graph banner from vector definitions.
 *
 *   npm run assets
 *
 * Output goes to client/public/. The files are committed so a plain
 * `npm run build` never depends on this script.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureText, textPolylines } from './lib/font.mjs';
import {
  circle,
  createCanvas,
  encodePng,
  paint,
  polygon,
  rect,
  roundedRect,
  stroke,
  union,
} from './lib/raster.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'client', 'public');

const BLUE = [11, 92, 171]; // --primary
const BLUE_DEEP = [8, 66, 124]; // --blue-800
const WHITE = [255, 255, 255];
const BLUE_LIGHT = [195, 224, 251]; // --blue-200

/* --------------------------------------------------------------- Logo */

/**
 * Shield with a help cross, drawn in a 0..1 square then scaled.
 * The shield reads as protection and the cross as help, which matches what
 * the app actually does: guidance plus the right number to call.
 */
function logoShapes(x, y, size, lineWidth) {
  const p = (px, py) => [x + px * size, y + py * size];
  const w = lineWidth * size;

  const shieldOutline = [
    p(0.5, 0.06),
    p(0.09, 0.21),
    p(0.09, 0.56),
    p(0.14, 0.72),
    p(0.26, 0.85),
    p(0.5, 0.95),
    p(0.74, 0.85),
    p(0.86, 0.72),
    p(0.91, 0.56),
    p(0.91, 0.21),
  ];

  return {
    fill: polygon(shieldOutline),
    outline: stroke(shieldOutline, w, true),
    cross: union([
      stroke([p(0.5, 0.3), p(0.5, 0.72)], w * 1.9),
      stroke([p(0.29, 0.51), p(0.71, 0.51)], w * 1.9),
    ]),
  };
}

function drawIcon(size, { bleed = false } = {}) {
  const canvas = createCanvas(size, size, BLUE);

  if (bleed) {
    // Maskable icons may be cropped to a circle, so keep the mark small.
    paint(canvas, circle(size / 2, size / 2, size * 0.46), BLUE_DEEP, 0.35);
  } else {
    // Rounded plate matching the manifest background for legacy launchers.
    paint(canvas, rect(0, 0, size, size), [246, 249, 253], 1);
    paint(canvas, roundedRect(0, 0, size, size, size * 0.22), BLUE, 1);
  }

  const inset = bleed ? 0.26 : 0.16;
  const artSize = size * (1 - inset * 2);
  const logo = logoShapes(size * inset, size * inset, artSize, 0.045);

  paint(canvas, logo.fill, WHITE, 0.16);
  paint(canvas, logo.outline, WHITE, 1);
  paint(canvas, logo.cross, WHITE, 1);

  return canvas;
}

/* ----------------------------------------------------- Open Graph card */

function drawOgImage() {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height, BLUE);

  // Depth without gradients: two soft translucent discs and a base band.
  paint(canvas, circle(width * 0.92, height * 0.16, 260), WHITE, 0.06);
  paint(canvas, circle(width * 0.78, height * 1.02, 300), WHITE, 0.05);
  paint(canvas, rect(0, height - 14, width, 14), BLUE_LIGHT, 1);

  const logo = logoShapes(80, 74, 104, 0.05);
  paint(canvas, logo.fill, WHITE, 0.18);
  paint(canvas, logo.outline, WHITE, 1);
  paint(canvas, logo.cross, WHITE, 1);

  const lines = [
    { text: 'AI DISASTER', y: 236, size: 92, weight: 13, color: WHITE, tracking: 4 },
    { text: 'APP', y: 236, size: 92, weight: 13, color: BLUE_LIGHT, tracking: 4, after: true },
    {
      text: 'SMART MULTILINGUAL EMERGENCY GUIDANCE',
      y: 386,
      size: 30,
      weight: 5,
      color: WHITE,
      tracking: 2,
    },
    {
      text: 'PAKISTAN \u00b7 ENGLISH / URDU / HINDI \u00b7 WORKS OFFLINE',
      y: 460,
      size: 24,
      weight: 4,
      color: BLUE_LIGHT,
      tracking: 2,
    },
  ];

  let inlineCursor = 80;

  for (const line of lines) {
    const x = line.after ? inlineCursor : 80;

    // Painted stroke by stroke: text is fully opaque, so overlapping joins
    // composite identically while each shape keeps a tight bounding box.
    for (const points of textPolylines(line.text, x, line.y, line.size, line.tracking)) {
      paint(canvas, stroke(points, line.weight), line.color, 1);
    }

    if (!line.after) {
      inlineCursor = x + measureText(line.text, line.size, line.tracking) + line.size * 0.6;
    }
  }

  return canvas;
}

/* ---------------------------------------------------------------- Run */

const outputs = [
  ['icons/icon-192.png', () => drawIcon(192)],
  ['icons/icon-512.png', () => drawIcon(512)],
  ['icons/icon-maskable-512.png', () => drawIcon(512, { bleed: true })],
  ['icons/apple-touch-icon.png', () => drawIcon(180)],
  ['og-image.png', drawOgImage],
];

for (const [relativePath, draw] of outputs) {
  const target = join(PUBLIC_DIR, relativePath);
  mkdirSync(dirname(target), { recursive: true });

  const png = encodePng(draw());
  writeFileSync(target, png);

  console.log(`wrote ${relativePath} (${(png.length / 1024).toFixed(1)} kB)`);
}
