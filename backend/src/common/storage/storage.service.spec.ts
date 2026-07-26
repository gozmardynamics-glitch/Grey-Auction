import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { mkdirSync, existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

jest.mock('fs', () => ({
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('StorageService', () => {
  let service: StorageService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-file-content'),
    size: 18,
    stream: undefined,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('uploadFile', () => {
    it('should save file and return metadata with hash', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

      const result = await service.uploadFile(mockFile, 'images');

      expect(result).toHaveProperty('url');
      expect(result.url).toContain('/uploads/images/');
      expect(result.url).toContain('test-image.jpg');
      expect(result.filename).toBe('test-image.jpg');
      expect(result.size).toBe(18);
      expect(result.mimetype).toBe('image/jpeg');
      expect(result).toHaveProperty('hash');
      expect(result.hash).toBe(createHash('sha256').update(mockFile.buffer).digest('hex'));

      const { writeFile } = require('fs/promises');
      expect(writeFile).toHaveBeenCalled();
    });
  });

  describe('getFileUrl', () => {
    it('should return the relative path as the URL', () => {
      const path = '/uploads/images/test-image.jpg';

      const result = service.getFileUrl(path);

      expect(result).toBe(path);
    });
  });

  describe('deleteFile', () => {
    it('should remove a file successfully', async () => {
      const { unlink } = require('fs/promises');

      await service.deleteFile('/uploads/images/test-image.jpg');

      expect(unlink).toHaveBeenCalled();
    });

    it('should handle missing file gracefully', async () => {
      const { unlink } = require('fs/promises');
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      (unlink as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.deleteFile('/uploads/images/missing.jpg')).resolves.toBeUndefined();
    });

    it('should throw error for non-ENOENT errors', async () => {
      const { unlink } = require('fs/promises');
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      (unlink as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.deleteFile('/uploads/images/file.jpg')).rejects.toThrow('Permission denied');
    });
  });
});
