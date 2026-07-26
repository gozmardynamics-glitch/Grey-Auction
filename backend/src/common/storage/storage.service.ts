import { Injectable, Logger } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

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
    const targetDir = join(this.uploadsDir, folder);
    mkdirSync(targetDir, { recursive: true });

    const uniqueName = `${Date.now()}-${file.originalname}`;
    const filePath = join(targetDir, uniqueName);

    await writeFile(filePath, file.buffer);

    const hash = createHash('sha256').update(file.buffer).digest('hex');

    const url = `/uploads/${folder}/${uniqueName}`;

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
      const cleaned = relativePath.replace(/^\/uploads\//, '');
      const absolutePath = join(this.uploadsDir, cleaned);
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
