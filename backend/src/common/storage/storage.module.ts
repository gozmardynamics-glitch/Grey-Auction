import { Module, DynamicModule, Logger } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ImageOptimizerService } from './image-optimizer.service';
import { STORAGE_DRIVER, StorageDriver } from './storage-driver.interface';
import { LocalStorageDriver } from './drivers/local-storage.driver';
import { S3StorageDriver } from './drivers/s3-storage.driver';

/**
 * Storage module (F3). Chooses a StorageDriver at bootstrap:
 *  - 'local' (default): zero-config disk store under ./uploads.
 *  - 's3': any S3-compatible backend (MinIO dev, Cloudflare R2 prod, AWS S3).
 *
 * The S3 driver is "silent switch" ready: enabling Cloudflare R2 later only
 * requires changing STORAGE_* env vars — no code changes.
 */
@Module({
  providers: [ImageOptimizerService],
  exports: [ImageOptimizerService],
})
export class StorageModule {
  static forRoot(): DynamicModule {
    const driverProvider = StorageModule.buildDriverProvider();
    return {
      module: StorageModule,
      providers: [StorageService, driverProvider],
      exports: [StorageService],
    };
  }

  private static buildDriverProvider() {
    const logger = new Logger('StorageModule');
    const driver = process.env.STORAGE_DRIVER || 'local';

    if (driver === 's3') {
      const cfg = {
        endpoint: process.env.S3_ENDPOINT,               // e.g. http://minio:9000
        region: process.env.S3_REGION || 'us-east-1',
        bucket: process.env.S3_BUCKET || 'greyauction',
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
        publicHost: process.env.S3_PUBLIC_HOST,          // optional CDN host (R2 public URL)
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
      };

      const missing = (['endpoint', 'accessKeyId', 'secretAccessKey'] as const).filter(
        (k) => !cfg[k],
      );
      if (missing.length > 0) {
        logger.warn(
          'STORAGE_DRIVER=s3 but missing ' + missing.join(', ') + ' — falling back to local disk',
        );
        return { provide: STORAGE_DRIVER, useClass: LocalStorageDriver };
      }

      return {
        provide: STORAGE_DRIVER,
        useFactory: () => new S3StorageDriver(cfg),
      };
    }

    // default: local
    return { provide: STORAGE_DRIVER, useClass: LocalStorageDriver };
  }
}
