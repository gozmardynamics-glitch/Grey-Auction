import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { STORAGE_DRIVER, StorageDriver } from './storage-driver.interface';
import { ImageOptimizerService, DEFAULT_IMAGE_VARIANTS } from './image-optimizer.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  hash: string;
  /** Variant URLs (only for images), e.g. { thumb, medium, large }. */
  variants?: Record<string, string>;
  width?: number;
  height?: number;
}

/**
 * Storage facade (F3). Delegates persistence to a StorageDriver (local disk
 * or any S3-compatible backend — MinIO by default, Cloudflare R2 later via
 * env-only change) and transparently optimizes images to WebP + responsive
 * variants with sharp.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_DRIVER) private readonly driver: StorageDriver,
    private readonly optimizer: ImageOptimizerService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    const sanitizedFolder = folder.replace(/\.\./g, '').replace(/[<>:"|?*\\]/g, '').replace(/^\/+/, '');
    const ext = file.mimetype === 'image/jpeg' ? 'jpg'
      : file.mimetype === 'image/png' ? 'png'
      : file.mimetype === 'image/webp' ? 'webp'
      : file.mimetype === 'image/gif' ? 'gif'
      : file.mimetype.includes('pdf') ? 'pdf'
      : file.mimetype.includes('msword') || file.mimetype.includes('wordprocessingml') ? 'docx'
      : 'bin';

    const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const baseKey = `${sanitizedFolder}/${id}`;
    const hash = createHash('sha256').update(file.buffer).digest('hex');

    const optimized = await this.optimizer.optimize(file.buffer, file.mimetype);

    let url: string;
    let size = file.size;
    let storedMimetype = file.mimetype;
    let variants: Record<string, string> | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (optimized) {
      // Store the bounded WebP original + responsive variants.
      const originalKey = baseKey + '.webp';
      await this.driver.put(originalKey, optimized.original, 'image/webp');
      url = this.driver.getUrl(originalKey);
      size = optimized.original.length;
      storedMimetype = 'image/webp';
      width = optimized.width;
      height = optimized.height;

      variants = {};
      for (const v of DEFAULT_IMAGE_VARIANTS) {
        const variantBuf = optimized.variants[v.name];
        const variantKey = baseKey + '-' + v.name + '.webp';
        await this.driver.put(variantKey, variantBuf, 'image/webp');
        variants[v.name] = this.driver.getUrl(variantKey);
      }
    } else {
      // Non-image or unoptimizable: store verbatim.
      const docKey = baseKey + '.' + ext;
      await this.driver.put(docKey, file.buffer, file.mimetype);
      url = this.driver.getUrl(docKey);
    }

    return {
      url,
      filename: file.originalname,
      size,
      mimetype: storedMimetype,
      hash,
      variants,
      width,
      height,
    };
  }

  getFileUrl(relativePath: string): string {
    return this.driver.getUrl(relativePath.replace(/^\/uploads\//, ''));
  }

  async deleteFile(relativeOrUrl: string): Promise<void> {
    if (!relativeOrUrl) return;
    // Accept either a key ("images/abc.webp") or a full URL ("/uploads/images/abc.webp").
    const key = relativeOrUrl
      .replace(/^\/uploads\//, '')
      .split('?')[0]
      .split('/').slice(-2).join('/');
    try {
      await this.driver.delete(key);
    } catch (e: any) {
      this.logger.error('Failed to delete file ' + key + ': ' + (e?.message || e));
    }
  }
}
