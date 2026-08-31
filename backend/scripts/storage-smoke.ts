/**
 * Storage smoke test (P1). Runs against a real S3-compatible endpoint:
 *
 *   S3_ENDPOINT=http://localhost:9010 \
 *   S3_ACCESS_KEY=greyauction \
 *   S3_SECRET_KEY=greyauction-test-secret \
 *   S3_BUCKET=greyauction-test \
 *   npx ts-node scripts/storage-smoke.ts
 *
 * Verifies the full round trip: upload → optimize → variants → public
 * fetch → delete (including variants). Also exercises the local disk
 * driver fallback. Exits non-zero on any failure.
 */
import { S3StorageDriver } from '../src/common/storage/drivers/s3-storage.driver';
import { LocalStorageDriver } from '../src/common/storage/drivers/local-storage.driver';
import { ImageOptimizerService } from '../src/common/storage/image-optimizer.service';
import { StorageService } from '../src/common/storage/storage.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp: any = require('sharp');
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

let failures = 0;
let checks = 0;

function check(name: string, ok: boolean, detail?: string): void {
  checks++;
  if (ok) {
    console.log("PASS  " + name + (detail ? " — " + detail : ""));
  } else {
    failures++;
    console.log("FAIL  " + name + (detail ? " — " + detail : ""));
  }
}

async function httpHead(url: string): Promise<{ status: number; contentType: string }> {
  const res = await fetch(url, { method: "HEAD" });
  return { status: res.status, contentType: res.headers.get("content-type") || "" };
}

async function main(): Promise<void> {
  // ── S3 (MinIO) round trip ────────────────────────────────────
  const cfg = {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9010",
    region: "us-east-1",
    bucket: process.env.S3_BUCKET || "greyauction-test",
    accessKeyId: process.env.S3_ACCESS_KEY || "greyauction",
    secretAccessKey: process.env.S3_SECRET_KEY || "greyauction-test-secret",
    forcePathStyle: true,
  };
  console.log("→ S3 endpoint: " + cfg.endpoint + " bucket: " + cfg.bucket);

  const s3 = new S3StorageDriver(cfg);
  const optimizer = new ImageOptimizerService();
  const s3Store = new StorageService(s3, optimizer);

  // Generate a real test image (solid colour 800x600).
  const imageBuf = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 210, g: 60, b: 30 } } })
    .png()
    .toBuffer();
  const imageFile = {
    fieldname: "file",
    originalname: "smoke-test.png",
    encoding: "7bit",
    mimetype: "image/png",
    buffer: imageBuf,
    size: imageBuf.length,
  } as Express.Multer.File;

  const img = await s3Store.uploadFile(imageFile, "smoke-images");
  check("image upload returns url", !!img.url, img.url);
  check("image is re-encoded to WebP", img.mimetype === "image/webp", img.mimetype);
  check("image has 3 responsive variants", !!img.variants && Object.keys(img.variants).length === 3, JSON.stringify(img.variants));
  check("image dimensions reported", (img.width || 0) > 0 && (img.height || 0) > 0, img.width + "x" + img.height);

  // Public fetch of original + variants.
  const originalHead = await httpHead(img.url);
  check("original URL is publicly fetchable", originalHead.status === 200, img.url + " → " + originalHead.status);
  check("original serves image/webp", originalHead.contentType === "image/webp", originalHead.contentType);
  for (const name of ["thumb", "medium", "large"]) {
    const vUrl = img.variants![name];
    const vHead = await httpHead(vUrl);
    check("variant " + name + " fetchable", vHead.status === 200, vUrl + " → " + vHead.status);
  }

  // Document upload (verbatim, no optimization).
  const pdfBuf = Buffer.from("%PDF-1.4 fake content for smoke test");
  const pdfFile = {
    fieldname: "file",
    originalname: "kyc.pdf",
    encoding: "7bit",
    mimetype: "application/pdf",
    buffer: pdfBuf,
    size: pdfBuf.length,
  } as Express.Multer.File;
  const doc = await s3Store.uploadFile(pdfFile, "documents");
  check("document upload returns url", !!doc.url, doc.url);
  check("document stored verbatim (pdf)", doc.mimetype === "application/pdf" && doc.url.endsWith(".pdf"), doc.url);
  check("document has no variants", doc.variants === undefined);
  const docHead = await httpHead(doc.url);
  check("document URL fetchable", docHead.status === 200, doc.url + " → " + docHead.status);

  // Delete image (must also remove variants).
  await s3Store.deleteFile(img.url);
  const imgAfter = await httpHead(img.url);
  check("image original deleted", imgAfter.status === 404, img.url + " → " + imgAfter.status);
  const thumbAfter = await httpHead(img.variants!.thumb);
  check("image thumb variant deleted too", thumbAfter.status === 404, img.variants!.thumb + " → " + thumbAfter.status);

  // Delete document.
  await s3Store.deleteFile(doc.url);
  const docAfter = await httpHead(doc.url);
  check("document deleted", docAfter.status === 404, doc.url + " → " + docAfter.status);

  // keyFromUrl round trips.
  check("keyFromUrl (path-style)", s3.keyFromUrl(cfg.endpoint + "/" + cfg.bucket + "/a/b/c.webp") === "a/b/c.webp", s3.keyFromUrl(cfg.endpoint + "/" + cfg.bucket + "/a/b/c.webp"));
  check("keyFromUrl (deep key)", s3.keyFromUrl("http://localhost:9010/greyauction-test/x/y/z.webp") === "x/y/z.webp");

  // ── Local disk round trip (fallback driver) ──────────────────
  const tmp = mkdtempSync(join(tmpdir(), "ga-storage-"));
  const prevCwd = process.cwd();
  process.chdir(tmp);
  try {
    const local = new LocalStorageDriver();
    const localStore = new StorageService(local, optimizer);
    const localImg = await localStore.uploadFile(imageFile, "smoke-local");
    check("local upload returns /uploads url", localImg.url.startsWith("/uploads/smoke-local/"), localImg.url);
    const localAbs = join(tmp, "uploads", localImg.url.replace("/uploads/", ""));
    check("local original exists on disk", existsSync(localAbs));
    const localThumb = join(tmp, "uploads", localImg.variants!.thumb.replace("/uploads/", ""));
    check("local thumb variant exists on disk", existsSync(localThumb));
    await localStore.deleteFile(localImg.url);
    check("local delete removes original", !existsSync(localAbs));
    check("local delete removes variants", !existsSync(localThumb));
    check("local keyFromUrl", local.keyFromUrl("/uploads/a/b/c.webp") === "a/b/c.webp");
  } finally {
    process.chdir(prevCwd);
    rmSync(tmp, { recursive: true, force: true });
  }

  console.log("");
  console.log("Smoke test: " + (checks - failures) + "/" + checks + " checks passed");
  if (failures > 0) {
    console.log("FAILURES: " + failures);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Smoke test crashed:", e);
  process.exitCode = 1;
});
