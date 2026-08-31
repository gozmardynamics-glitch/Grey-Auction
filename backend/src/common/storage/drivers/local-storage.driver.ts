import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { StorageDriver, StoredObject } from '../storage-driver.interface';

/**
 * Zero-config disk driver. Writes under ./uploads and serves files at
 * /uploads/<key> via the static host (see main.ts / serve-static). Used for
 * local development and as a fallback when no S3 endpoint is configured.
 */
@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly logger = new Logger(LocalStorageDriver.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = resolve(process.cwd(), 'uploads');
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<StoredObject> {
    const abs = join(this.baseDir, key);
    if (!abs.startsWith(this.baseDir)) {
      throw new Error('Path traversal rejected');
    }
    await mkdir(join(abs, '..'), { recursive: true });
    await writeFile(abs, buffer);
    return { key, url: this.getUrl(key), size: buffer.length, contentType };
  }

  async delete(key: string): Promise<void> {
    const abs = join(this.baseDir, key);
    if (!abs.startsWith(this.baseDir)) throw new Error('Path traversal rejected');
    try {
      await unlink(abs);
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        this.logger.error('Failed to delete ' + key + ': ' + e.message);
        throw e;
      }
    }
  }

  getUrl(key: string): string {
    return '/uploads/' + key.replace(/\\/g, '/');
  }

  keyFromUrl(url: string): string {
    return url
      .replace(/^\/uploads\//, '')
      .split('?')[0]
      .replace(/^\/+/, '');
  }
}