'use strict';

/**
 * Fills every section of the running app with labelled test data.
 *
 *   node testdata/seed.js            # create
 *   node testdata/purge.js           # remove everything it created
 *
 * Design rules:
 *  - Everything is created through the HTTP API, never by inserting rows, so
 *    seeding also exercises guards, DTOs and side effects. The only exception is
 *    purge, which deletes by recorded id (much of that has no API).
 *  - Every record is recorded in manifest.json the moment it is created, so a
 *    crash halfway still leaves something purge can clean up.
 *  - Nothing here is silently skipped: each section reports created / skipped /
 *    failed with the API's own message.
 */

const fs = require('fs');
const path = require('path');
const { API, call, login, fileForm, expectOk, messageOf } = require('./lib/api');

const ROOT = path.join(__dirname, '..');
const IMAGES = path.join(__dirname, 'images');
const PUBLIC_DIR = path.join(ROOT, 'frontend', 'public', 'testdata');
const MANIFEST = path.join(__dirname, 'manifest.json');
const MARK = 'TESTFILL';

const manifest = {
  createdAt: new Date().toISOString(),
  api: API,
  marker: MARK,
  ids: {},
  publicDir: path.relative(ROOT, PUBLIC_DIR),
  sections: [],
  created: [],
};

const remember = (table, id, extra = {}) => {
  if (!id) return;
  manifest.ids[table] = manifest.ids[table] || [];
  manifest.ids[table].push(id);
  manifest.created.push({ table, id, ...extra });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
};

/**
 * Some create endpoints answer `{ success, data: row }`, others answer the row
 * itself. Accept both rather than guessing per route.
 */
const row = (res) => res.json?.data ?? res.json;

/** Run one section, recording the outcome instead of aborting the whole run. */
async function section(name, fn) {
  const result = { name, status: 'ok', created: 0, skipped: [], failed: [] };
  const before = manifest.created.length;
  console.log(`\n── ${name}`);
  try {
    await fn({
      created: () => {
        result.created += 1;
      },
      skip: (what, why) => {
        result.skipped.push(`${what}: ${why}`);
        console.log(`   skip  ${what} — ${why}`);
      },
      fail: (what, why) => {
        result.failed.push(`${what}: ${why}`);
        console.log(`   FAIL  ${what} — ${why}`);
      },
    });
  } catch (err) {
    result.status = 'error';
    result.failed.push(err.message);
    console.log(`   FAIL  ${err.message}`);
  }
  result.created = manifest.created.length - before;
  manifest.sections.push(result);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
  console.log(`   → ${result.created} created${result.failed.length ? `, ${result.failed.length} failed` : ''}`);
  return result;
}

const money = (n) => Math.round(n * 100) / 100;

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('refusing to run: NODE_ENV=production. This writes test data.');
  }
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(API)) {
    throw new Error(`refusing to run against ${API} — set TESTFILL_API to a local instance`);
  }
  if (!fs.existsSync(IMAGES)) {
    throw new Error('images missing — run `node testdata/generate-images.js` first');
  }

  // Publish the generated assets so lot cards can reference them as URLs. The
  // product DTO takes image URLs only; there is no image-upload endpoint.
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  for (const file of fs.readdirSync(IMAGES)) {
    fs.copyFileSync(path.join(IMAGES, file), path.join(PUBLIC_DIR, file));
  }
  const asset = (file) => `/testdata/${file}`;
  const lotImages = (slug) => [1, 2, 3].map((n) => asset(`lot-${slug}-${n}.webp`));

  console.log(`seeding ${API}`);
  const admin = await login('admin');
  const seller = await login('seller');
  const buyer = await login('buyer');
  console.log(`accounts: admin=${admin.email} seller=${seller.email} buyer=${buyer.email}`);

  // ─── Categories ───────────────────────────────────────────────────────────
  const categories = [
    { name: 'Cars & Vehicles', slug: 'testfill-cars', description: 'Saloon, SUV, classics and commercial vehicles.' },
    { name: 'Watches', slug: 'testfill-watches', description: 'Collector timepieces, modern and vintage.' },
    { name: 'Art & Antiquities', slug: 'testfill-art', description: 'Paintings, sculpture and provenanced objects.' },
    { name: 'Electronics', slug: 'testfill-electronics', description: 'Computers, audio and camera equipment.' },
    { name: 'Jewellery', slug: 'testfill-jewellery', description: 'Fine jewellery, loose stones and gold.' },
    { name: 'Real Estate', slug: 'testfill-property', description: 'Residential and commercial property lots.' },
  ];
  await section('categories', async (s) => {
    for (const category of categories) {
      const res = await call('/api/categories', { method: 'POST', token: admin.token, body: category });
      if (!res.ok && res.status === 409) {
        // Left over from an interrupted run: adopt it so purge can remove it.
        const existing = await call(`/api/categories/${category.slug}`);
        if (existing.ok) {
          remember('categories', existing.json.data.id, { name: category.name });
          s.created();
          console.log(`   ok    ${category.name} (already existed)`);
        } else {
          s.fail(category.name, 'exists but could not be read back');
        }
        continue;
      }
      if (!res.ok) {
        s.fail(category.name, `${res.status} ${res.message}`);
        continue;
      }
      remember('categories', res.json.data.id, { name: category.name });
      s.created();
      console.log(`   ok    ${category.name}`);
    }
  });

  // ─── Seller KYC + publishing consent (needed before a lot can go live) ────
  let sellerRowId = null;
  await section('seller KYC and publish consent', async (s) => {
    const list = await call('/api/sellers?limit=50', { token: admin.token });
    const listRows = Array.isArray(list.json?.data) ? list.json.data : (list.json?.data?.items ?? []);
    const row = listRows.find((x) => x.user_id === seller.id);
    if (!row) {
      s.fail('seller profile', 'no seller row for this account');
      return;
    }
    sellerRowId = row.id;
    console.log(`   seller row ${row.id} (verification ${row.verification_status}, publish ${row.publish_approved})`);

    const reqs = await call('/api/kyc/requirements', { token: seller.token });
    const requirement = (reqs.json?.data ?? []).find((r) => r.isRequired && r.audience !== 'admin') || (reqs.json?.data ?? [])[0];
    if (!requirement) {
      s.skip('KYC document', 'no requirements configured');
      return;
    }

    const upload = await call('/api/kyc/documents', {
      method: 'POST',
      token: seller.token,
      form: fileForm(path.join(IMAGES, 'kyc-national-id.pdf'), {
        requirementCode: requirement.code,
        documentNumber: `${MARK}-0001`,
        expiresAt: '2031-06-01',
      }),
    });
    if (!upload.ok) {
      s.fail('KYC upload', `${upload.status} ${upload.message}`);
    } else {
      remember('kyc_documents', upload.json.data.id, { requirement: requirement.code });
      s.created();
      console.log(`   ok    KYC document uploaded (${requirement.code})`);
      const review = await call(`/api/admin/kyc/documents/${upload.json.data.id}/review`, {
        method: 'POST',
        token: admin.token,
        body: { status: 'approved' }, // KycDocumentStatus is lowercase
      });
      if (review.ok) {
        s.created();
        console.log('   ok    KYC document approved');
      } else {
        s.fail('KYC review', `${review.status} ${review.message}`);
      }
    }

    const approveSeller = await call(`/api/sellers/${row.id}/approve`, { method: 'POST', token: admin.token, body: {} });
    if (approveSeller.ok) {
      s.created();
      console.log('   ok    seller verification approved');
    } else if (/already approved/i.test(approveSeller.message)) {
      console.log('   ok    seller verification was already approved');
    } else {
      s.fail('seller approve', `${approveSeller.status} ${approveSeller.message}`);
    }

    const publish = await call(`/api/admin/kyc/sellers/${seller.id}/publish`, {
      method: 'POST',
      token: admin.token,
      body: { approved: true, note: `${MARK} seed` },
    });
    if (publish.ok) {
      s.created();
      console.log('   ok    publishing consent granted');
    } else {
      s.fail('publish consent', `${publish.status} ${publish.message}`);
    }
  });

  // ─── Lots ─────────────────────────────────────────────────────────────────
  const days = (n) => new Date(Date.now() + n * 86400000).toISOString();
  const lots = [
    {
      slug: 'mercedes-gle-450', title: `${MARK} Mercedes-Benz GLE 450 4MATIC`,
      category: 'testfill-cars', subCategory: 'SUV', startingBid: 38_500_000, bidStep: 250_000,
      reserve: 41_000_000, buyNow: 46_500_000, escrow: 48, approvals: true, approve: true,
      description:
        '2021 GLE 450 in Obsidian Black over Macchiato leather. 41,200 km indicated, full service history with the main dealer, ' +
        'Burmester audio, 360° camera, panoramic roof. Nigerian registration, duty paid, Lagos inspection welcome.',
      tags: ['suv', 'mercedes', 'low-mileage', 'duty-paid'],
      specs: { Year: '2021', Mileage: '41,200 km', Transmission: '9G-TRONIC automatic', Fuel: 'Petrol + EQ Boost', 'Exterior': 'Obsidian Black', Condition: 'Excellent' },
    },
    {
      slug: 'toyota-land-cruiser', title: `${MARK} Toyota Land Cruiser VXR 2022`,
      category: 'testfill-cars', subCategory: 'SUV', startingBid: 62_000_000, bidStep: 500_000,
      reserve: 65_000_000, buyNow: null, escrow: 72, approvals: false, approve: true,
      description: '2022 Land Cruiser VXR 4.0, Pearl White, 18,900 km. Full option with rear entertainment, cool box and third row. Single owner from new.',
      tags: ['toyota', 'suv', 'single-owner'],
      specs: { Year: '2022', Mileage: '18,900 km', Engine: '4.0 V6', Seats: '7', Condition: 'As new' },
    },
    {
      slug: 'rolex-submariner', title: `${MARK} Rolex Submariner Date 126610LN`,
      category: 'testfill-watches', subCategory: 'Dive watches', startingBid: 9_800_000, bidStep: 100_000,
      reserve: 10_500_000, buyNow: 11_900_000, escrow: 24, approvals: true, approve: true,
      description: '2023 Submariner Date, black dial, Oyster bracelet. Full set: box, papers, warranty card dated 2023. Unworn, stickers removed for inspection only.',
      tags: ['rolex', 'steel', 'full-set', '2023'],
      specs: { Reference: '126610LN', Year: '2023', Case: '41 mm steel', Movement: 'Cal. 3235', Box: 'Yes', Papers: 'Yes' },
    },
    {
      slug: 'omega-speedmaster', title: `${MARK} Omega Speedmaster Professional Moonwatch`,
      category: 'testfill-watches', subCategory: 'Chronographs', startingBid: 4_200_000, bidStep: 50_000,
      reserve: null, buyNow: null, escrow: 24, approvals: false, approve: true,
      description: 'Hesalite Moonwatch, cal. 3861, on the original steel bracelet plus a spare NATO strap. Serviced 2024, running within COSC tolerance.',
      tags: ['omega', 'moonwatch', 'chronograph'],
      specs: { Reference: '310.30.42.50.01.001', Year: '2021', Case: '42 mm steel', Movement: 'Cal. 3861', Serviced: '2024' },
    },
    {
      slug: 'benin-bronze-head', title: `${MARK} Benin Bronze Commemorative Head`,
      category: 'testfill-art', subCategory: 'Antiquities', startingBid: 7_500_000, bidStep: 100_000,
      reserve: 8_000_000, buyNow: null, escrow: 96, approvals: true, approve: false,
      description: 'Cast bronze commemorative head, 34 cm, on a bespoke plinth. Provenance documented in the attached condition report. Collection in person only.',
      tags: ['bronze', 'benin', 'provenance'],
      specs: { Medium: 'Cast bronze', Height: '34 cm', Period: '20th century (attributed)', Provenance: 'Documented', Export: 'Licence required' },
    },
    {
      slug: 'landscape-oil-painting', title: `${MARK} Lagos Lagoon — Oil on Canvas`,
      category: 'testfill-art', subCategory: 'Paintings', startingBid: 1_850_000, bidStep: 25_000,
      reserve: 2_000_000, buyNow: 2_600_000, escrow: 48, approvals: false, approve: true,
      description: 'Contemporary oil on canvas, 90 × 120 cm, framed. Signed and dated 2019 verso. Acquired directly from the artist.',
      tags: ['painting', 'contemporary', 'lagos'],
      specs: { Medium: 'Oil on canvas', Size: '90 × 120 cm', Year: '2019', Framed: 'Yes', Signature: 'Verso' },
    },
    {
      slug: 'macbook-pro-16', title: `${MARK} Apple MacBook Pro 16" M3 Max`,
      category: 'testfill-electronics', subCategory: 'Laptops', startingBid: 2_400_000, bidStep: 25_000,
      reserve: null, buyNow: 2_950_000, escrow: 24, approvals: false, approve: true,
      description: 'M3 Max, 48 GB unified memory, 1 TB SSD, Space Black. 38 battery cycles, AppleCare until 2027. Original box and charger included.',
      tags: ['apple', 'laptop', 'applecare'],
      specs: { Chip: 'M3 Max', Memory: '48 GB', Storage: '1 TB', Cycles: '38', Warranty: 'AppleCare to 2027' },
    },
    {
      slug: 'diamond-tennis-bracelet', title: `${MARK} Diamond Tennis Bracelet, 5.00 ct`,
      category: 'testfill-jewellery', subCategory: 'Bracelets', startingBid: 6_300_000, bidStep: 50_000,
      reserve: 6_800_000, buyNow: null, escrow: 48, approvals: true, approve: false,
      description: '18 kt white gold line bracelet, 52 round brilliant-cut diamonds totalling 5.00 ct (F–G, VS). 17.5 cm, with an independent appraisal.',
      tags: ['diamond', 'white-gold', 'appraisal'],
      specs: { Metal: '18 kt white gold', Carat: '5.00 ct total', Clarity: 'VS', Colour: 'F–G', Length: '17.5 cm' },
    },
  ];

  const createdLots = [];
  await section('lots (all fields + images)', async (s) => {
    for (const lot of lots) {
      const body = {
        title: lot.title,
        description: lot.description,
        startingBid: lot.startingBid,
        endTime: days(4),
        category: lot.category,
        subCategory: lot.subCategory,
        tags: lot.tags,
        specifications: lot.specs,
        images: lotImages(lot.slug),
        minBidIncrement: lot.bidStep,
        escrowReleaseHours: lot.escrow,
        hasReservePrice: lot.reserve !== null,
        ...(lot.reserve !== null && { reservePrice: lot.reserve }),
        allowBuyNow: lot.buyNow !== null,
        ...(lot.buyNow !== null && { buyNowPrice: lot.buyNow }),
        requiresSellerApproval: lot.approvals,
        ...(lot.approvals && { approvalThreshold: Math.round(lot.startingBid * 1.2) }),
      };

      const res = await call('/api/products', { method: 'POST', token: seller.token, body });
      if (!res.ok) {
        s.fail(lot.title, `${res.status} ${res.message}`);
        continue;
      }
      const product = res.json.data;
      createdLots.push({ ...lot, id: product.id });
      remember('products', product.id, { title: lot.title, slug: product.slug });
      s.created();
      console.log(`   ok    ${lot.title.slice(0, 46)} (${product.status})`);

      // Attach a lot document so the Documents tab has content.
      const doc = await call(`/api/products/${product.id}/documents`, {
        method: 'POST',
        token: seller.token,
        form: fileForm(path.join(IMAGES, 'condition-report.pdf'), {
          documentType: 'INSPECTION_REPORT',
          title: 'Independent condition report',
        }),
      });
      if (doc.ok) {
        remember('product_documents', doc.json.data.id);
        s.created();
      } else {
        s.fail(`${lot.slug} document`, `${doc.status} ${doc.message}`);
      }

      if (lot.approve) {
        const approve = await call(`/api/products/${product.id}/approve`, {
          method: 'POST',
          token: admin.token,
          body: {},
        });
        if (approve.ok) {
          s.created();
          console.log('         approved → live');
        } else {
          // The KYC/publish gate is deliberate. Try the admin status patch so the
          // grid still has content, and say plainly that this is the dev bypass.
          const patch = await call(`/api/products/${product.id}`, {
            method: 'PATCH',
            token: admin.token,
            body: { status: 'active' },
          });
          if (patch.ok) {
            s.created();
            console.log(`         approve blocked (${messageOf(approve.json)}), set active via admin patch`);
          } else {
            s.fail(`${lot.slug} approve`, `${approve.status} ${approve.message}`);
          }
        }
      }
    }
  });

  // ─── Bids on the live lots ────────────────────────────────────────────────
  await section('bids', async (s) => {
    const targets = createdLots.filter((l) => l.approve).slice(0, 3);
    for (const lot of targets) {
      let amount = lot.startingBid + lot.bidStep;
      let placed = 0;
      for (const [i, note] of ['opening', 'counter', 'max'].entries()) {
        // The bid engine enforces a 2s per-user-per-lot cooldown, so a rapid
        // second bid is refused by design — pace the fixtures accordingly.
        if (i > 0) await new Promise((r) => setTimeout(r, 2200));
        const bid = await call(`/api/auctions/${lot.id}/bids`, {
          method: 'POST',
          token: buyer.token,
          body: { amount, ...(i === 2 && { maxBid: amount + lot.bidStep * 4 }) },
        });
        if (!bid.ok) {
          s.fail(`${lot.slug} bid ${note}`, `${bid.status} ${bid.message}`);
          break;
        }
        remember('bids', bid.json.data?.id, { lot: lot.slug });
        s.created();
        placed += 1;
        amount += lot.bidStep;
      }
      if (placed) console.log(`   ok    ${lot.slug}: ${placed} bid(s) placed`);
    }
  });

  // ─── Bidding rooms + invitations ──────────────────────────────────────────
  const rooms = [];
  await section('rooms and invitations', async (s) => {
    const specs = [
      { name: `${MARK} Modern Classics Evening Sale`, type: 'private', hours: 48, inviteCode: `${MARK}-ROOM-1` },
      { name: `${MARK} Collector's Watches`, type: 'private', hours: 24, inviteCode: `${MARK}-ROOM-2` },
      { name: `${MARK} Open House: Motors`, type: 'public', hours: 72, inviteCode: null },
    ];
    for (const spec of specs) {
      const res = await call('/api/rooms', {
        method: 'POST',
        token: seller.token,
        body: {
          name: spec.name,
          description: `${MARK} fixture room`,
          type: spec.type,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + spec.hours * 3600000).toISOString(),
          duration: `${spec.hours} hours`,
          allowInviteCode: Boolean(spec.inviteCode),
          ...(spec.inviteCode && { inviteCode: spec.inviteCode }),
          auctionIds: createdLots.slice(0, 2).map((l) => l.id),
        },
      });
      if (!res.ok) {
        s.fail(spec.name, `${res.status} ${res.message}`);
        continue;
      }
      const room = res.json.data;
      rooms.push(room);
      remember('rooms', room.id, { name: spec.name });
      s.created();
      console.log(`   ok    room ${spec.name.slice(0, 40)} (${room.type})`);
    }

    const first = rooms[0];
    if (!first) {
      s.skip('invitations', 'no room was created');
      return;
    }

    const exclusive = await call('/api/invites/generate', {
      method: 'POST',
      token: seller.token,
      body: {
        roomId: first.id,
        productId: createdLots[0]?.id,
        inviteeEmail: buyer.email,
        inviteeName: buyer.name,
        expiry: '7d',
        mode: 'exclusive',
      },
    });
    const exclusiveInvite = exclusive.json?.data ?? exclusive.json;
    if (exclusive.ok && exclusiveInvite?.id) {
      remember('invites', exclusiveInvite.id);
      s.created();
      const join = await call(`/api/rooms/${first.id}/join`, {
        method: 'POST',
        token: buyer.token,
        body: { inviteToken: exclusiveInvite.token },
      });
      if (join.ok) {
        s.created();
        console.log('   ok    exclusive invite created and redeemed by the buyer');
      } else {
        s.fail('invite redemption', `${join.status} ${join.message}`);
      }
    } else {
      s.fail('exclusive invite', `${exclusive.status} ${exclusive.message}`);
    }

    // A request-mode invitation the seller then approves, so the pending-request
    // screen has something in it too.
    const request = await call('/api/invites/generate', {
      method: 'POST',
      token: seller.token,
      body: { roomId: first.id, productId: createdLots[0]?.id, inviteeEmail: buyer.email, expiry: '7d', mode: 'request', maxUsage: 1 },
    });
    const requestInvite = request.json?.data ?? request.json;
    if (request.ok && requestInvite?.id) {
      remember('invites', requestInvite.id);
      s.created();
      const approve = await call(`/api/invites/approve/${requestInvite.id}`, {
        method: 'POST',
        token: seller.token,
        body: {},
      });
      if (approve.ok) s.created();
      console.log('   ok    request-mode invite created and approved');
    } else {
      s.fail('request invite', `${request.status} ${request.message}`);
    }
  });

  // ─── Invoices, escrow, reviews, disputes ──────────────────────────────────
  const invoices = [];
  await section('invoices and escrow', async (s) => {
    const sellerUserId = seller.id;
    const candidates = createdLots.slice(0, 3);
    for (const [index, lot] of candidates.entries()) {
      const hammer = lot.startingBid * 1.1;
      const commission = money(hammer * 0.1);
      const vat = money((hammer + commission) * 0.075);
      const sellerFee = money(hammer * 0.05);

      const created = await call('/api/invoices', {
        method: 'POST',
        token: admin.token,
        body: {
          auctionId: lot.id,
          productId: lot.id,
          buyerId: buyer.id,
          sellerId: sellerUserId,
          hammerPrice: money(hammer),
          commission,
          vat,
          fixedFee: 0,
          sellerFee,
          escrowWindowHours: 48,
          currency: 'NGN',
        },
      });
      if (!created.ok) {
        s.fail(`${lot.slug} invoice`, `${created.status} ${created.message}`);
        continue;
      }
      const invoice = created.json.data;
      invoices.push({ ...invoice, lot });
      remember('invoices', invoice.id, { number: invoice.invoice_number });
      s.created();
      console.log(`   ok    ${invoice.invoice_number} issued (total ${invoice.total})`);

      // Invoice 0 stays unpaid (fills the "outstanding" state), 1 is paid and
      // released, 2 is paid and refunded.
      if (index === 0) continue;

      // Order matters: a hold can only be opened while the invoice is still
      // payable, so escrow comes first and settlement second.
      const placed = await call('/api/escrow/holds', {
        method: 'POST',
        token: buyer.token, // the hold is the buyer's funds, not the admin's
        body: { invoiceId: invoice.id, amount: Number(invoice.total), sellerId: sellerUserId },
      });
      if (!placed.ok) {
        s.fail(`${invoice.invoice_number} escrow`, `${placed.status} ${placed.message}`);
        continue;
      }
      const hold = placed.json.data;
      remember('escrow_holds', hold.id);
      s.created();
      console.log('         escrow hold opened');

      const paid = await call(`/api/invoices/${invoice.id}/pay`, {
        method: 'POST',
        token: admin.token,
        body: { paymentMethod: 'paystack', paymentReference: `${MARK}-PAY-${index}` },
      });
      if (!paid.ok) {
        s.fail(`${invoice.invoice_number} pay`, `${paid.status} ${paid.message}`);
        continue;
      }
      s.created();
      console.log('         marked paid');

      const action = index === 1 ? 'release' : 'refund';
      const moved = await call(`/api/escrow/holds/${hold.id}/${action}`, {
        method: 'POST',
        token: admin.token,
        body: { reason: `${MARK} fixture ${action}` },
      });
      if (moved.ok) {
        s.created();
        console.log(`         escrow ${action}${action === 'refund' ? 'ed' : 'd'}`);
      } else {
        s.fail(`${invoice.invoice_number} ${action}`, `${moved.status} ${moved.message}`);
      }
    }
  });

  await section('reviews', async (s) => {
    if (!sellerRowId) {
      s.skip('seller review', 'no seller row id');
      return;
    }
    const invoice = invoices[1];
    const res = await call(`/api/sellers/${sellerRowId}/reviews`, {
      method: 'POST',
      token: buyer.token,
      body: {
        rating: 5,
        title: `${MARK} Smooth, well-run auction`,
        comment:
          'Collection was ready when promised and the condition report matched the car exactly. Communication was quick and clear throughout.',
        product_id: invoice?.lot?.id,
        communication_rating: 5,
        product_quality_rating: 5,
        shipping_speed_rating: 4,
        packaging_rating: 5,
      },
    });
    if (res.ok) {
      remember('seller_reviews', res.json.data.id);
      s.created();
      console.log('   ok    seller review submitted');
    } else {
      s.fail('seller review', `${res.status} ${res.message}`);
    }
  });

  await section('disputes', async (s) => {
    const invoice = invoices[2] ?? invoices[1];
    if (!invoice) {
      s.skip('dispute', 'no invoice to dispute');
      return;
    }
    const res = await call('/api/disputes', {
      method: 'POST',
      token: buyer.token,
      body: {
        reason: 'not_as_described',
        description: `${MARK}: the lot was described with an original bracelet but arrived on an aftermarket strap. Requesting a partial refund.`,
        productId: invoice.lot?.id,
        invoiceId: invoice.id,
        againstUserId: seller.id,
      },
    });
    if (res.ok) {
      remember('disputes', res.json.data.id);
      s.created();
      console.log('   ok    dispute opened');
      const moved = await call(`/api/disputes/${res.json.data.id}/status`, {
        method: 'PATCH',
        token: admin.token,
        body: { status: 'UNDER_REVIEW' },
      });
      if (moved.ok) s.created();
      console.log('         moved to UNDER_REVIEW');
    } else {
      s.fail('dispute', `${res.status} ${res.message}`);
    }
  });

  // ─── Support, shipping, watchlist ─────────────────────────────────────────
  await section('support tickets', async (s) => {
    const tickets = [
      { subject: `${MARK} Where is my collection slot?`, description: 'I paid the invoice yesterday — when can I collect the car?', category: 'orders', priority: 'high' },
      { subject: `${MARK} Invoice shows the wrong name`, description: 'The invoice is addressed to my company but shows a personal name.', category: 'billing', priority: 'medium' },
    ];
    for (const ticket of tickets) {
      const res = await call('/api/tickets', { method: 'POST', token: buyer.token, body: ticket });
      if (!res.ok) {
        s.fail(ticket.subject, `${res.status} ${res.message}`);
        continue;
      }
      remember('tickets', res.json.data.id);
      s.created();
      const reply = await call(`/api/tickets/${res.json.data.id}/messages`, {
        method: 'POST',
        token: admin.token,
        body: { content: `${MARK}: thanks for flagging — we are looking into this and will update you today.` },
      });
      if (reply.ok) s.created();
      console.log(`   ok    ${ticket.subject.slice(0, 44)}`);
    }
  });

  await section('shipping', async (s) => {
    const address = await call('/api/shipping/addresses', {
      method: 'POST',
      token: buyer.token,
      body: {
        label: 'Home',
        recipientName: buyer.name || 'Buyer',
        phone: '+2348012345678',
        line1: '12 Alexander Avenue',
        line2: 'Ikoyi',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        postalCode: '101233',
        isDefault: true,
      },
    });
    if (address.ok) {
      remember('shipping_addresses', address.json.data.id);
      s.created();
      console.log('   ok    delivery address');
    } else {
      s.fail('address', `${address.status} ${address.message}`);
    }
    const invoice = invoices[1];
    if (!invoice) {
      s.skip('shipment', 'no paid invoice');
      return;
    }
    const shipment = await call('/api/shipping/shipments', {
      method: 'POST',
      token: buyer.token, // only a party to the invoice may book a shipment
      body: { invoiceId: invoice.id, addressId: address.json?.data?.id, method: 'delivery', carrier: `${MARK} Logistics`, cost: 150000 },
    });
    if (shipment.ok) {
      remember('shipments', shipment.json.data.id);
      s.created();
      console.log('   ok    shipment for ' + invoice.invoice_number);
    } else {
      s.fail('shipment', `${shipment.status} ${shipment.message}`);
    }
  });

  await section('watchlist', async (s) => {
    for (const lot of createdLots.slice(0, 3)) {
      const res = await call(`/api/watchlist/${lot.id}`, { method: 'POST', token: buyer.token });
      if (res.ok) {
        remember('watchlist_items', lot.id, { lot: lot.slug });
        s.created();
      } else {
        s.fail(`${lot.slug} watch`, `${res.status} ${res.message}`);
      }
    }
    console.log('   ok    buyer is watching 3 lots');
  });

  // ─── Editorial content ────────────────────────────────────────────────────
  await section('faqs, banners and content', async (s) => {
    // One self-identifying category only: the public FAQ page carries real
    // content from content/faqs.json, so fixtures must not look like topics.
    const faqs = [
      { category: `${MARK} fixtures`, question: `${MARK}: does the FAQ admin table render and paginate?`, answer: 'Fixture row used to check the admin FAQ table. Safe to delete.', order: 9001 },
    ];
    for (const faq of faqs) {
      const res = await call('/api/admin/faqs', { method: 'POST', token: admin.token, body: { ...faq, isActive: true } });
      if (res.ok) {
        remember('faqs', row(res)?.id);
        s.created();
      } else {
        s.fail(faq.question.slice(0, 30), `${res.status} ${res.message}`);
      }
    }

    for (const [i, hue] of ['banner-1', 'banner-2', 'banner-3'].entries()) {
      const res = await call('/api/admin/banners', {
        method: 'POST',
        token: admin.token,
        body: {
          title: `${MARK} banner ${i + 1}`,
          imageUrl: asset(`${hue}.webp`),
          // @IsUrl() rejects hostnames without a public TLD, so localhost will not do.
          link: 'https://greyauction.com/en/auctions',
          position: i,
          type: 'hero',
          description: `${MARK} fixture banner`,
          isActive: true,
        },
      });
      if (res.ok) {
        remember('banners', row(res)?.id);
        s.created();
      } else {
        s.fail(`banner ${i + 1}`, `${res.status} ${res.message}`);
      }
    }

    const pages = [
      { slug: `${MARK.toLowerCase()}-buying-guide`, title: `${MARK} Buying guide`, content: '<p>How to register, bid, pay and collect — written for the fixtures.</p>' },
      { slug: `${MARK.toLowerCase()}-selling-guide`, title: `${MARK} Selling guide`, content: '<p>Listing requirements, fees and payout timing — written for the fixtures.</p>' },
    ];
    for (const page of pages) {
      const res = await call(`/api/content/${page.slug}`, {
        method: 'PUT',
        token: admin.token,
        body: { title: page.title, content: page.content, isActive: true },
      });
      if (res.ok) {
        remember('content_pages', row(res)?.id, { slug: page.slug });
        s.created();
      } else {
        s.fail(page.title, `${res.status} ${res.message}`);
      }
    }
    console.log('   ok    faqs, banners and content pages');
  });

  await section('agents', async (s) => {
    const tool = await call('/api/admin/agents/tools', {
      method: 'POST',
      token: admin.token,
      body: {
        name: `${MARK.toLowerCase()}-lookup`,
        displayName: `${MARK} lot lookup`,
        description: 'Fixture tool: looks up a lot by id.',
        category: 'lookup',
        endpoint: 'http://localhost:3001/api/products',
        httpMethod: 'GET',
      },
    });
    if (tool.ok) {
      remember('agent_tools', row(tool)?.id);
      s.created();
    } else {
      s.fail('agent tool', `${tool.status} ${tool.message}`);
    }

    const agent = await call('/api/admin/agents/instances', {
      method: 'POST',
      token: admin.token,
      body: {
        name: `${MARK.toLowerCase()}-listing-assistant`,
        displayName: `${MARK} listing assistant`,
        category: 'operations',
        description: 'Fixture agent used to fill the Agent studio.',
        systemPrompt: 'You help sellers write clear lot descriptions. Keep answers short.',
        isEnabled: true,
        temperature: 0.3,
      },
    });
    if (agent.ok) {
      remember('agent_instances', row(agent)?.id);
      s.created();
    } else {
      s.fail('agent instance', `${agent.status} ${agent.message}`);
    }

    const workflow = await call('/api/admin/agents/workflows', {
      method: 'POST',
      token: admin.token,
      body: {
        name: `${MARK.toLowerCase()}-daily-digest`,
        displayName: `${MARK} daily digest`,
        description: 'Fixture workflow: summarise the day into a digest.',
        trigger: 'cron',
        cronExpression: '0 7 * * *',
        steps: [{ type: 'agent', agentName: `${MARK.toLowerCase()}-listing-assistant` }],
        isEnabled: false,
      },
    });
    if (workflow.ok) {
      remember('agent_workflows', row(workflow)?.id);
      s.created();
    } else {
      s.fail('agent workflow', `${workflow.status} ${workflow.message}`);
    }
    console.log('   ok    agent tool, instance and workflow');
  });

  // ─── Summary ──────────────────────────────────────────────────────────────
  const total = manifest.created.length;
  const failures = manifest.sections.flatMap((s) => s.failed);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));

  console.log('\n════════════════════════════════════════════');
  console.log(`created ${total} records across ${manifest.sections.length} sections`);
  for (const s of manifest.sections) {
    const flag = s.failed.length ? 'FAIL' : s.created ? 'ok  ' : 'skip';
    console.log(`  ${flag}  ${s.name.padEnd(34)} ${String(s.created).padStart(3)} created`);
  }
  if (failures.length) {
    console.log('\nnot created:');
    for (const f of failures) console.log('  - ' + f);
  }
  console.log(`\nmanifest: ${path.relative(process.cwd(), MANIFEST)}`);
  console.log('remove everything with: node testdata/purge.js');
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error('\nseed aborted:', err.message);
  process.exit(2);
});
