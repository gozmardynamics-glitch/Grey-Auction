'use strict';

/**
 * Removes everything testdata/seed.js created, in one request.
 *
 *   node testdata/purge.js              # delete
 *   node testdata/purge.js --keep-files # delete rows, leave the local assets
 *
 * Deletion is by recorded id from manifest.json — never by prefix guessing, so a
 * real row that happens to share a word with the fixtures cannot be caught. Rows
 * are removed inside one transaction in dependency order, so a failure leaves
 * the database exactly as it was rather than half-purged.
 *
 * Some of these tables have no delete endpoint (bids, invoices, escrow holds,
 * reviews, watchlist rows), which is why this last step talks to Postgres
 * directly instead of the API.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(__dirname, 'manifest.json');
const PUBLIC_DIR = path.join(ROOT, 'frontend', 'public', 'testdata');
const IMAGES = path.join(__dirname, 'images');

/** Child → parent. Deleting in this order satisfies every foreign key. */
const ORDER = [
  'shipments',
  'shipping_addresses',
  'disputes',
  'seller_reviews',
  'tickets',
  'escrow_holds',
  'invoices',
  'watchlist_items',
  'product_documents',
  'bids',
  'products',
  'room_participants',
  'rooms',
  'invites',
  'kyc_documents',
  'faqs',
  'banners',
  'content_pages',
  'agent_workflows',
  'agent_tools',
  'agent_instances',
  'categories',
];

function loadDbCredentials() {
  const file = path.join(ROOT, 'backend', '.env');
  const env = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) env[match[1]] = match[2].trim();
    }
  }
  return {
    host: process.env.DB_HOST || env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD ?? env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE || env.DB_DATABASE || 'greyauction',
  };
}

async function main() {
  const keepFiles = process.argv.includes('--keep-files');

  if (!fs.existsSync(MANIFEST)) {
    console.log('nothing to purge: no manifest.json (the seeder has not run)');
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const ids = manifest.ids || {};

  const { Client } = require(path.join(ROOT, 'backend', 'node_modules', 'pg'));
  const client = new Client(loadDbCredentials());
  await client.connect();

  const removed = {};
  let skipped = 0;
  try {
    await client.query('BEGIN');

    // room_participants has no recorded ids of its own (the API creates the row
    // when a bidder joins), so its rows are removed by room id up front — the
    // rooms foreign key blocks the delete otherwise.
    const roomIdsEarly = ids.rooms || [];
    if (roomIdsEarly.length) {
      const res = await client.query('DELETE FROM room_participants WHERE "roomId" = ANY($1::uuid[])', [roomIdsEarly]);
      if (res.rowCount) removed.room_participants = res.rowCount;
    }

    for (const table of ORDER) {
      const tableIds = ids[table] || [];
      if (!tableIds.length) continue;

      // TypeORM emitted camelCase columns ("productId"), so they need quoting.
      // watchlist rows are recorded by product id, which is what we have.
      const column = table === 'watchlist_items' ? '"productId"' : 'id';
      // Ids are uuid columns; cast the array to uuid[] rather than text[].
      const res = await client.query(`DELETE FROM ${table} WHERE ${column} = ANY($1::uuid[])`, [tableIds]);
      removed[table] = res.rowCount;
      skipped += tableIds.length - res.rowCount;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    await client.end();
    console.error('purge failed and was rolled back — nothing was deleted:', err.message);
    process.exit(1);
  }
  await client.end();

  const total = Object.values(removed).reduce((sum, n) => sum + n, 0);
  console.log(`removed ${total} rows:`);
  for (const [table, count] of Object.entries(removed)) {
    if (count) console.log(`  ${table.padEnd(22)} ${count}`);
  }
  if (skipped > 0) console.log(`  (${skipped} recorded ids were already gone — left over from an earlier purge)`);

  if (!keepFiles) {
    for (const dir of [PUBLIC_DIR, IMAGES]) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`removed ${path.relative(ROOT, dir)}/`);
      }
    }
  }

  fs.rmSync(MANIFEST, { force: true });
  console.log('removed manifest.json');
  console.log('\nDone. Re-create the fixtures any time with: node testdata/generate-images.js && node testdata/seed.js');
}

main().catch((err) => {
  console.error('purge failed:', err.message);
  process.exit(1);
});
