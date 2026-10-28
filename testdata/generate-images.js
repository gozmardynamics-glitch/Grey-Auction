'use strict';

/**
 * Generates every image/PDF the fixtures need, locally, with no network calls
 * and no licensing questions: gradients + labels rendered by sharp, and PDFs by
 * pdfkit (both already in backend/node_modules because the app itself uses
 * them).
 *
 * Everything is deliberately stamped "TEST DATA" so a screenshot taken from the
 * seeded app can never be mistaken for a real listing.
 *
 *   node testdata/generate-images.js
 */

const fs = require('fs');
const path = require('path');
// The app already depends on both, so reuse its install instead of adding a
// third copy of sharp to the repo.
const ROOT = path.join(__dirname, '..');
const fromBackend = (name) => require(path.join(ROOT, 'backend', 'node_modules', name));
const sharp = fromBackend('sharp');
const PDFDocument = fromBackend('pdfkit');

const OUT = path.join(__dirname, 'images');

const LOTS = [
  { slug: 'mercedes-gle-450', label: 'Mercedes-Benz GLE 450 2021', hue: 212, kind: 'Vehicle' },
  { slug: 'toyota-land-cruiser', label: 'Toyota Land Cruiser VXR 2022', hue: 30, kind: 'Vehicle' },
  { slug: 'rolex-submariner', label: 'Rolex Submariner Date 126610LN', hue: 145, kind: 'Watch' },
  { slug: 'omega-speedmaster', label: 'Omega Speedmaster Professional', hue: 260, kind: 'Watch' },
  { slug: 'benin-bronze-head', label: 'Benin Bronze Commemorative Head', hue: 20, kind: 'Antiquity' },
  { slug: 'landscape-oil-painting', label: 'Lagos Lagoon — Oil on Canvas', hue: 195, kind: 'Art' },
  { slug: 'macbook-pro-16', label: 'MacBook Pro 16" M3 Max', hue: 220, kind: 'Electronics' },
  { slug: 'diamond-tennis-bracelet', label: 'Diamond Tennis Bracelet 5ct', hue: 300, kind: 'Jewellery' },
];

const ANGLES = ['Front', 'Detail', 'In context'];

function svg({ w, h, hue, title, subtitle, badge }) {
  const light = `hsl(${hue} 62% 62%)`;
  const dark = `hsl(${(hue + 28) % 360} 55% 26%)`;
  const deep = `hsl(${(hue + 12) % 360} 48% 14%)`;
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${dark}"/>
      <stop offset="55%" stop-color="${deep}"/>
      <stop offset="100%" stop-color="#101014"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.28" r="0.75">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${light}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <g opacity="0.14" stroke="#ffffff" stroke-width="1">
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${(i * w) / 9}" y1="0" x2="${(i * w) / 9}" y2="${h}"/>`).join('')}
    ${Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="${(i * h) / 6}" x2="${w}" y2="${(i * h) / 6}"/>`).join('')}
  </g>
  <text x="${w * 0.07}" y="${h * 0.2}" fill="#ffffff" fill-opacity="0.55"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.038)}"
        letter-spacing="${Math.round(h * 0.008)}">${badge.toUpperCase()}</text>
  <text x="${w * 0.07}" y="${h * 0.52}" fill="#ffffff"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.072)}"
        font-weight="600">${escapeXml(title)}</text>
  <text x="${w * 0.07}" y="${h * 0.62}" fill="#ffffff" fill-opacity="0.72"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.042)}">${escapeXml(subtitle)}</text>
  <rect x="${w * 0.07}" y="${h * 0.72}" width="${w * 0.2}" height="${Math.round(h * 0.012)}" fill="${light}"/>
  <text x="${w * 0.07}" y="${h * 0.9}" fill="#ffffff" fill-opacity="0.4"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.03)}">Test data — not a real listing</text>
</svg>`);
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
}

function avatarSvg({ size = 256, hue, initials }) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 65% 55%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 60% 32%)"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size / 2}" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#ffffff"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${size * 0.38}" font-weight="600">${escapeXml(initials)}</text>
</svg>`);
}

async function writePdf(filePath, lines) {
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(20).text(lines.title);
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#666666').text('TEST DATA — generated by testdata/generate-images.js');
    doc.moveDown(1);
    doc.fillColor('#111111').fontSize(11);
    for (const line of lines.body) {
      doc.text(line);
      doc.moveDown(0.55);
    }
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Lot photographs: three "angles" each, 1400x933 (3:2) so cards crop well.
  for (const lot of LOTS) {
    for (const [index, angle] of ANGLES.entries()) {
      const file = path.join(OUT, `lot-${lot.slug}-${index + 1}.webp`);
      const buf = svg({
        w: 1400,
        h: 933,
        hue: (lot.hue + index * 14) % 360,
        title: lot.label,
        subtitle: `${lot.kind} · ${angle}`,
        badge: `Lot photo ${index + 1} of ${ANGLES.length}`,
      });
      await sharp(buf).webp({ quality: 82 }).toFile(file);
    }
  }

  // Banner for the homepage carousel.
  for (const [i, hue] of [268, 22, 190].entries()) {
    const buf = svg({
      w: 1600,
      h: 520,
      hue,
      title: ['The Lagos Collector Sale', 'Modern & Classic Timepieces', 'Estate Jewellery'][i],
      subtitle: 'Bidding opens Friday · 120 lots',
      badge: 'Hero banner',
    });
    await sharp(buf).webp({ quality: 84 }).toFile(path.join(OUT, `banner-${i + 1}.webp`));
  }

  // Avatars for the seeded accounts.
  for (const [name, hue] of [
    ['Alex Doe', 205],
    ['Mo Seller', 150],
    ['Buyer Four', 320],
  ]) {
    const buf = avatarSvg({
      hue,
      initials: name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
    });
    await sharp(buf).png().toFile(path.join(OUT, `avatar-${name.toLowerCase().replace(/\s+/g, '-')}.png`));
  }

  // Documents: a KYC identity sheet and a lot condition report, both PDFs so the
  // upload path (and the private-document read path) gets exercised too.
  await writePdf(path.join(OUT, 'kyc-national-id.pdf'), {
    title: 'National Identity Document',
    body: [
      'Name: Mo Seller',
      'Document number: TESTFILL-0001',
      'Date of birth: 1990-04-12',
      'Issued: 2021-06-01   Expires: 2031-06-01',
      '',
      'This is a placeholder document created for development and testing only.',
      'It carries no real identity information.',
    ],
  });

  await writePdf(path.join(OUT, 'condition-report.pdf'), {
    title: 'Independent Condition Report',
    body: [
      'Inspection date: 2026-10-20',
      'Inspector: Adeyemi O., GreyAuction Condition Desk',
      '',
      'Bodywork: sound, no accident history recorded.',
      'Mechanical: full service history, 41,200 km indicated.',
      'Interior: light wear consistent with mileage.',
      'Instruments and electrics: all functions verified.',
      '',
      'Generated for testing purposes; not a real inspection.',
    ],
  });

  const written = fs.readdirSync(OUT);
  console.log(`generated ${written.length} files in ${path.relative(process.cwd(), OUT)}`);
  for (const f of written.sort()) console.log('  ' + f);
}

main().catch((err) => {
  console.error('image generation failed:', err.message);
  process.exit(1);
});
