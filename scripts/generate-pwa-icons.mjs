import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const NAVY = [4, 41, 99, 255];
const PAPER = [244, 247, 251, 255];
const ORANGE = [242, 98, 0, 255];
const GOLD = [244, 169, 0, 255];

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function png(size, paint) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x / (size - 1), y / (size - 1));
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function insideRound(x, y, radius) {
  const dx = Math.max(Math.abs(x - 0.5) - (0.5 - radius), 0);
  const dy = Math.max(Math.abs(y - 0.5) - (0.5 - radius), 0);
  return dx * dx + dy * dy <= radius * radius;
}

function rect(x, y, left, top, right, bottom) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function companyMark(x, y) {
  if (rect(x, y, 0.28, 0.24, 0.72, 0.32)) return ORANGE;
  if (rect(x, y, 0.28, 0.36, 0.62, 0.4)) return PAPER;
  if (rect(x, y, 0.28, 0.46, 0.68, 0.5)) return PAPER;
  if (rect(x, y, 0.28, 0.56, 0.58, 0.6)) return PAPER;
  if (rect(x, y, 0.28, 0.66, 0.5, 0.7)) return GOLD;
  return null;
}

function employeeMark(x, y) {
  const dx = x - 0.5;
  const dy = y - 0.38;
  if (dx * dx + dy * dy <= 0.075 * 0.075) return PAPER;
  if (rect(x, y, 0.32, 0.56, 0.68, 0.74) && (x - 0.5) * (x - 0.5) * 8 + (y - 0.78) * (y - 0.78) <= 0.08) {
    return PAPER;
  }
  if (rect(x, y, 0.34, 0.78, 0.66, 0.82)) return GOLD;
  return null;
}

function paint(kind, maskable) {
  return (x, y) => {
    const mark = kind === "company" ? companyMark(x, y) : employeeMark(x, y);
    if (maskable) return mark ?? NAVY;
    if (!insideRound(x, y, 0.18)) return [0, 0, 0, 0];
    return mark ?? NAVY;
  };
}

const root = join(process.cwd(), "public", "pwa");
const files = [
  ["company", false, 192, "icon-192.png"],
  ["company", false, 512, "icon-512.png"],
  ["company", true, 512, "icon-512-maskable.png"],
  ["employee", false, 192, "icon-192.png"],
  ["employee", false, 512, "icon-512.png"],
  ["employee", true, 512, "icon-512-maskable.png"],
];

for (const [kind, maskable, size, name] of files) {
  const path = join(root, kind, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png(size, paint(kind, maskable)));
}
