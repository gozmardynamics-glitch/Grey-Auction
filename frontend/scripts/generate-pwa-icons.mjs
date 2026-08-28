/**
 * Generates the PWA icon PNGs from the SVG masters in public/icons/.
 * Run from the frontend root:  node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(here, '..', 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const base = readFileSync(path.join(iconsDir, 'icon.svg'));
const maskable = readFileSync(path.join(iconsDir, 'icon-maskable.svg'));

const jobs = [
  { src: base, size: 192, out: 'icon-192.png' },
  { src: base, size: 512, out: 'icon-512.png' },
  { src: maskable, size: 512, out: 'icon-maskable-512.png' },
  { src: base, size: 180, out: 'apple-touch-icon.png' },
];

for (const job of jobs) {
  await sharp(job.src, { density: 300 }).resize(job.size, job.size).png().toFile(path.join(iconsDir, job.out));
  console.log('wrote', job.out);
}
