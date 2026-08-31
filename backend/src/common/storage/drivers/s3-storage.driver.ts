import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageDriver, StoredObject } from '../storage-driver.interface';

export interface S3DriverConfig {
  endpoint?: string;      // e.g. http://minio:9000 (MinIO) or https://<acct>.r2.cloudflarestorage.com (R2)
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** When true, URLs are built as https://<bucket>.<public-host>/<key> (CDN-style). */
  publicHost?: string;
  /** Force path-style addressing (required by MinIO; R2/AWS use virtual-host). */
  forcePathStyle?: boolean;
}

/**
 * S3-compatible storage driver. Works with MinIO (dev, zero egress cost),
 * Cloudflare R2 (free egress), AWS S3, or DigitalOcean Spaces. Switching
 * backends later is a pure config change — no code changes.
 */
@Injectable()
export class S3StorageDriver implements StorageDriver, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(S3StorageDriver.name);
  private client: S3Client;
  private readonly cfg: S3DriverConfig;

  constructor(cfg: S3DriverConfig) {
    this.cfg = cfg;
  }

  onModuleInit(): void {
    this.client = new S3Client({
      endpoint: this.cfg.endpoint,
      region: this.cfg.region,
      credentials: {
        accessKeyId: this.cfg.accessKeyId,
        secretAccessKey: this.cfg.secretAccessKey,
      },
      forcePathStyle: this.cfg.forcePathStyle ?? true,
    });
    this.logger.log(
      'S3 storage driver ready (bucket=' + this.cfg.bucket + ', endpoint=' + (this.cfg.endpoint || 'AWS default') + ')',
    );
  }

  onModuleDestroy(): void {
    this.client?.destroy();
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return { key, url: this.getUrl(key), size: buffer.length, contentType };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: key }),
    );
  }

  getUrl(key: string): string {
    if (this.cfg.publicHost) {
      return 'https://' + this.cfg.publicHost + '/' + key;
    }
    // MinIO / path-style URL.
    const host = (this.cfg.endpoint || '').replace(/^https?:\/\//, '') || 's3.amazonaws.com';
    if (this.cfg.forcePathStyle) {
      return (this.cfg.endpoint || 'http://minio:9000') + '/' + this.cfg.bucket + '/' + key;
    }
    return 'https://' + host + '/' + this.cfg.bucket + '/' + key;
  }

  keyFromUrl(url: string): string {
    const withoutQuery = url.split('?')[0];
    // publicHost form: https://<host>/<key>
    if (this.cfg.publicHost) {
      const prefix = 'https://' + this.cfg.publicHost + '/';
      if (withoutQuery.startsWith(prefix)) return withoutQuery.slice(prefix.length);
    }
    // Path-style and virtual-host forms both carry the bucket as the first
    // path segment: strip scheme + host, then the bucket prefix.
    let rest = withoutQuery.replace(/^https?:\/\//, '');
    const slash = rest.indexOf('/');
    if (slash >= 0) rest = rest.slice(slash + 1);
    if (rest.startsWith(this.cfg.bucket + '/')) {
      rest = rest.slice(this.cfg.bucket.length + 1);
    }
    return rest;
  }
}