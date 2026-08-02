import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { mkdir } from 'fs/promises';
import { writeFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = resolve(process.cwd(), 'uploads');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{
    url: string;
    filename: string;
    size: number;
    mimetype: string;
    hash: string;
  }> {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    const sanitizedFolder = folder.replace(/\.\./g, '').replace(/[<>:"|?*\\]/g, '');
    const targetDir = join(this.uploadsDir, sanitizedFolder);
    await mkdir(targetDir, { recursive: true });

    const safeFilename = `${Date.now()}-${file.originalname.replace(/\.\./g, '').replace(/[<>:"|?*\\]/g, '')}`;
    const filePath = join(targetDir, safeFilename);

    if (!filePath.startsWith(this.uploadsDir)) {
      throw new BadRequestException('Invalid file path');
    }

    await writeFile(filePath, file.buffer);

    const hash = createHash('sha256').update(file.buffer).digest('hex');

    const url = `/uploads/${sanitizedFolder}/${safeFilename}`;

    return {
      url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      hash,
    };
  }

  getFileUrl(relativePath: string): string {
    return relativePath;
  }

  async deleteFile(relativePath: string): Promise<void> {
    try {
      const cleaned = relativePath.replace(/^\/uploads\//, '').replace(/\.\./g, '');
      const absolutePath = join(this.uploadsDir, cleaned);
      if (!absolutePath.startsWith(this.uploadsDir)) {
        throw new Error('Path traversal detected');
      }
      await unlink(absolutePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Failed to delete file: ${error.message}`);
        throw error;
      }
      this.logger.warn(`File not found for deletion: ${relativePath}`);
    }
  }
}
