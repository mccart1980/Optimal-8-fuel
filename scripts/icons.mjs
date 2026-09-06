/* Generates the app icons into public/ — no image libraries needed.
   The mark: the ink square, an ember rule across the top (the app's header),
   and a bold "8" drawn as two rings. Run with: npm run icons */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const INK = [0x14, 0x11, 0x0d], EMBER = [0xd9, 0x77, 0x42], BONE = [0xf0, 0xe8, 0xd8];

function crc32(buf) {
  let c, t = [];
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0xffffffff;
  for (const b of buf) crc = t[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, px) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0, o = 0; y < size; y++) { raw[o++] = 0; for (let x = 0; x < size; x++) { const c = px(x, y); raw[o++] = c[0]; raw[o++] = c[1]; raw[o++] = c[2]; } }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * Math.max(0, Math.min(1, t))));

/* inset: fraction of padding around the mark. Maskable icons need more. */
function draw(size, inset) {
  const s = size, m = s * inset;          // usable box
  const box = s - 2 * m;
  const rBig = box * 0.235, rSm = box * 0.185;   // the 8's two rings
  const stroke = box * 0.10;
  const cx = s / 2;
  const cyTop = m + box * 0.30, cyBot = m + box * 0.735;
  const barY0 = m + box * 0.015, barY1 = barY0 + Math.max(2, box * 0.055);
  const barX0 = m + box * 0.10, barX1 = s - m - box * 0.10;

  return (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    if (px >= barX0 && px <= barX1 && py >= barY0 && py <= barY1) return EMBER;
    let best = 99;
    for (const [cy, r] of [[cyTop, rSm], [cyBot, rBig]]) {
      const d = Math.abs(Math.hypot(px - cx, py - cy) - r) - stroke / 2;
      if (d < best) best = d;
    }
    if (best <= 0) return BONE;
    if (best < 1.2) return mix(BONE, INK, best / 1.2);   // cheap antialiasing
    return INK;
  };
}

mkdirSync(OUT, { recursive: true });
const files = [
  ["icon-192.png", 192, 0.14],
  ["icon-512.png", 512, 0.14],
  ["icon-512-maskable.png", 512, 0.22],
  ["apple-touch-icon.png", 180, 0.14],
  ["favicon-32.png", 32, 0.10],
];
for (const [name, size, inset] of files) {
  writeFileSync(join(OUT, name), png(size, draw(size, inset)));
  console.log("wrote public/" + name + "  " + size + "×" + size);
}
