/**
 * Minimal software rasteriser + PNG encoder.
 *
 * The project keeps its dependency list short, so brand raster assets (PWA
 * icons, Open Graph image) are produced from vector definitions with Node core
 * modules only. Run `npm run assets` after changing a design.
 */

import { deflateSync } from 'node:zlib';

const SUPERSAMPLE = 4;

/* ------------------------------------------------------------- Canvas */

export function createCanvas(width, height, background = [255, 255, 255]) {
  const pixels = new Float32Array(width * height * 3);

  for (let i = 0; i < width * height; i += 1) {
    pixels[i * 3] = background[0];
    pixels[i * 3 + 1] = background[1];
    pixels[i * 3 + 2] = background[2];
  }

  return { width, height, pixels };
}

/** Paints a shape onto the canvas with supersampled edges. */
export function paint(canvas, shape, color, alpha = 1) {
  const [bx0, by0, bx1, by1] = shape.bbox;
  const x0 = Math.max(0, Math.floor(bx0));
  const y0 = Math.max(0, Math.floor(by0));
  const x1 = Math.min(canvas.width - 1, Math.ceil(bx1));
  const y1 = Math.min(canvas.height - 1, Math.ceil(by1));
  const step = 1 / SUPERSAMPLE;
  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      let hits = 0;

      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          if (shape.inside(x + (sx + 0.5) * step, y + (sy + 0.5) * step)) hits += 1;
        }
      }

      if (!hits) continue;

      const coverage = (hits / samples) * alpha;
      const index = (y * canvas.width + x) * 3;

      for (let channel = 0; channel < 3; channel += 1) {
        const current = canvas.pixels[index + channel];
        canvas.pixels[index + channel] = current + (color[channel] - current) * coverage;
      }
    }
  }
}

/* ------------------------------------------------------------- Shapes */

export function rect(x, y, width, height) {
  return {
    bbox: [x, y, x + width, y + height],
    inside: (px, py) => px >= x && px <= x + width && py >= y && py <= y + height,
  };
}

export function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  const x1 = x + width;
  const y1 = y + height;

  return {
    bbox: [x, y, x1, y1],
    inside(px, py) {
      if (px < x || px > x1 || py < y || py > y1) return false;

      const cx = Math.min(Math.max(px, x + r), x1 - r);
      const cy = Math.min(Math.max(py, y + r), y1 - r);
      const dx = px - cx;
      const dy = py - cy;

      return dx * dx + dy * dy <= r * r;
    },
  };
}

export function circle(cx, cy, radius) {
  return {
    bbox: [cx - radius, cy - radius, cx + radius, cy + radius],
    inside: (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= radius * radius,
  };
}

export function polygon(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);

  return {
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    inside(px, py) {
      let inside = false;

      for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        const crosses = yi > py !== yj > py;

        if (crosses && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }

      return inside;
    },
  };
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));

  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Round-capped, round-joined stroke through a list of points. */
export function stroke(points, width, closed = false) {
  const half = width / 2;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const segments = [];
  const last = closed ? points.length : points.length - 1;

  for (let i = 0; i < last; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    segments.push([a[0], a[1], b[0], b[1]]);
  }

  return {
    bbox: [
      Math.min(...xs) - half,
      Math.min(...ys) - half,
      Math.max(...xs) + half,
      Math.max(...ys) + half,
    ],
    inside(px, py) {
      for (const [ax, ay, bx, by] of segments) {
        if (distanceToSegment(px, py, ax, ay, bx, by) <= half) return true;
      }

      return false;
    },
  };
}

/** Combines shapes so overlapping strokes are painted at a single alpha. */
export function union(shapes) {
  const boxes = shapes.map((shape) => shape.bbox);

  return {
    bbox: [
      Math.min(...boxes.map((b) => b[0])),
      Math.min(...boxes.map((b) => b[1])),
      Math.max(...boxes.map((b) => b[2])),
      Math.max(...boxes.map((b) => b[3])),
    ],
    inside(px, py) {
      for (const shape of shapes) {
        if (shape.inside(px, py)) return true;
      }

      return false;
    },
  };
}

/* ------------------------------------------------------- PNG encoding */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));

  return Buffer.concat([length, typed, crc]);
}

/** Encodes the canvas as an opaque 8-bit RGB PNG. */
export function encodePng(canvas) {
  const { width, height, pixels } = canvas;
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type: none

    for (let i = 0; i < stride; i += 1) {
      raw[rowStart + 1 + i] = Math.max(0, Math.min(255, Math.round(pixels[y * stride + i])));
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
