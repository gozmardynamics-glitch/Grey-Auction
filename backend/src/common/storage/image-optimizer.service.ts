import { Injectable, Logger } from '@nestjs/common';
// sharp v0.35 ships dual .d.ts/.d.mts types; the CommonJS build resolves to
// a namespace with no call signature. Import the type + require the runtime.
import type { Sharp, SharpOptions } from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharpFactory: (input?: Buffer | string, options?: SharpOptions) => Sharp = require('sharp');

export interface ImageVariant {
  /** Key suffix, e.g. "thumb", "medium", "large". */
  name: string;
  width: number;
  height?: number;
  fit?: 'cover' | 'inside' | 'fill';
  quality?: number;
}

export interface OptimizedImage {
  /** The full-width/quality WebP "original" (bounded to MAX_DIMENSION). */
  original: Buffer;
  /** Resized WebP variants keyed by variant name. */
  variants: Record<string, Buffer>;
  width: number;
  height: number;
  format: string;
}

/** Default responsive variants (suffix → specs). */
export const DEFAULT_IMAGE_VARIANTS: ImageVariant[] = [
  { name: 'large', width: 1200, height: 900, fit: 'inside', quality: 80 },
  { name: 'medium', width: 600, height: 450, fit: 'inside', quality: 78 },
  { name: 'thumb', width: 200, height: 200, fit: 'cover', quality: 75 },
];

/** Cap the largest dimension so a 20MP upload can't balloon storage. */
const MAX_DIMENSION = 2560;

/**
 * Resizes + re-encodes images to WebP using sharp, generating the original
 * plus a set of responsive variants. Non-image buffers are passed through
 * untouched (documents/Python files are stored as-is).
 */
@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);

  /** True when the mimetype is a raster image we can safely re-encode. */
  isImage(mimetype: string): boolean {
    return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
      (mimetype || '').toLowerCase(),
    );
  }

  async optimize(
    buffer: Buffer,
    mimetype: string,
    variants: ImageVariant[] = DEFAULT_IMAGE_VARIANTS,
  ): Promise<OptimizedImage | null> {
    if (!this.isImage(mimetype)) return null;

    try {
      // Read dimensions from a single reusable instance.
      const meta = await sharpFactory(buffer).metadata();
      const width = meta.width || 0;
      const height = meta.height || 0;

      const original = await sharpFactory(buffer)
        .rotate()
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const out: Record<string, Buffer> = {};
      for (const v of variants) {
        out[v.name] = await sharpFactory(buffer)
          .rotate()
          .resize(v.width, v.height ?? (v.width * 3) / 4, { fit: v.fit || 'inside', withoutEnlargement: true })
          .webp({ quality: v.quality ?? 80 })
          .toBuffer();
      }

      return {
        original,
        variants: out,
        width,
        height,
        format: 'webp',
      };
    } catch (e) {
      this.logger.warn('Image optimization failed, storing original: ' + (e as Error).message);
      return null;
    }
  }
}