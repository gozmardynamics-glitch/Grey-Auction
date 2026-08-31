import { Module, Logger } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ImageOptimizerService } from './image-optimizer.service';
import { STORAGE_DRIVER, StorageDriver } from './storage-driver.interface';
import { LocalStorageDriver } from './drivers/local-storage.driver';
import { S3StorageDriver } from './drivers/s3-storage.driver';

/**
 * Chooses the StorageDriver at DI time from env:
 *  - STORAGE_DRIVER=s3 → S3-compatible backend (MinIO dev, Cloudflare R2 prod,
 *    AWS S3) — requires S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY.
 *  - otherwise → zero-config local disk driver.
 *
 * The S3 driver is "silent switch" ready: enabling Cloudflare R2 later only
 * requires changing STORAGE_* env vars — no code changes.
 */
export function buildStorageDriver(): StorageDriver {
  const logger = new Logger("StorageModule");
  const driver = process.env.STORAGE_DRIVER || "local";

  if (driver === "s3") {
    const cfg = {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "us-east-1",
      bucket: process.env.S3_BUCKET || "greyauction",
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET_KEY || "",
      publicHost: process.env.S3_PUBLIC_HOST,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    };
    const missing = (["endpoint", "accessKeyId", "secretAccessKey"] as const).filter((k) => !cfg[k]);
    if (missing.length === 0) {
      logger.log("Using S3 storage (bucket=" + cfg.bucket + ", endpoint=" + cfg.endpoint + ")");
      return new S3StorageDriver(cfg);
    }
    logger.warn(
      "STORAGE_DRIVER=s3 but missing " + missing.join(", ") + " — falling back to local disk",
    );
  }

  logger.log("Using local disk storage");
  return new LocalStorageDriver();
}

@Module({
  providers: [
    ImageOptimizerService,
    StorageService,
    {
      provide: STORAGE_DRIVER,
      useFactory: () => buildStorageDriver(),
    },
  ],
  exports: [StorageService, ImageOptimizerService],
})
export class StorageModule {}
