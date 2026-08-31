import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { STORAGE_DRIVER, StorageDriver } from './storage-driver.interface';
import { ImageOptimizerService } from './image-optimizer.service';
import { createHash } from 'crypto';

describe('StorageService', () => {
  let service: StorageService;

  const mockDriver: StorageDriver = {
    put: jest.fn().mockImplementation(async (key: string, buffer: Buffer, contentType: string) => ({
      key, url: '/uploads/' + key, size: buffer.length, contentType,
    })),
    delete: jest.fn().mockResolvedValue(undefined),
    getUrl: jest.fn().mockImplementation((key: string) => '/uploads/' + key),
  };

  const mockOptimizer = {
    isImage: jest.fn().mockReturnValue(true),
    optimize: jest.fn().mockResolvedValue({
      original: Buffer.from('original-webp'),
      variants: {
        large: Buffer.from('large'),
        medium: Buffer.from('medium'),
        thumb: Buffer.from('thumb'),
      },
      width: 1200,
      height: 900,
      format: 'webp',
    }),
  };

  const mockImage: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-image-content'),
    size: 18,
    stream: undefined,
    destination: '',
    filename: '',
    path: '',
  };

  const mockDoc: Express.Multer.File = {
    ...mockImage,
    originalname: 'kyc.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('pdf-content'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: STORAGE_DRIVER, useValue: mockDriver },
        { provide: ImageOptimizerService, useValue: mockOptimizer },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('uploadFile (image)', () => {
    it('optimizes to WebP and stores original + variants', async () => {
      const result = await service.uploadFile(mockImage, 'images');

      expect(mockOptimizer.optimize).toHaveBeenCalledWith(mockImage.buffer, 'image/jpeg');
      expect(result.url).toContain('.webp');
      expect(result.mimetype).toBe('image/webp');
      expect(result.variants).toBeDefined();
      expect(result.variants!.thumb).toContain('thumb.webp');
      expect(result.variants!.medium).toContain('medium.webp');
      expect(result.variants!.large).toContain('large.webp');
      expect(result.width).toBe(1200);
      expect(result.height).toBe(900);
      expect(result.hash).toBe(createHash('sha256').update(mockImage.buffer).digest('hex'));
    });
  });

  describe('uploadFile (document)', () => {
    it('stores non-image files verbatim (no optimization)', async () => {
      (mockOptimizer.optimize as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.uploadFile(mockDoc, 'documents');

      expect(mockOptimizer.optimize).toHaveBeenCalled();
      expect(result.variants).toBeUndefined();
      expect(result.mimetype).toBe('application/pdf');
      expect(result.url).toContain('.pdf');
    });
  });

  describe('validation', () => {
    it('rejects oversized files', async () => {
      const big = { ...mockImage, size: 11 * 1024 * 1024 };
      await expect(service.uploadFile(big, 'images')).rejects.toThrow(/10MB/);
    });

    it('rejects disallowed mimetypes', async () => {
      const evil = { ...mockImage, mimetype: 'application/x-msdownload', size: 100 };
      await expect(service.uploadFile(evil, 'images')).rejects.toThrow(/not allowed/);
    });
  });

  describe('getFileUrl', () => {
    it('delegates to the driver', () => {
      const url = service.getFileUrl('images/abc.webp');
      expect(mockDriver.getUrl).toHaveBeenCalledWith('images/abc.webp');
      expect(url).toContain('abc.webp');
    });
  });

  describe('deleteFile', () => {
    it('delegates delete to the driver', async () => {
      await service.deleteFile('images/abc.webp');
      expect(mockDriver.delete).toHaveBeenCalled();
    });

    it('swallows deletion errors gracefully', async () => {
      (mockDriver.delete as jest.Mock).mockRejectedValueOnce(new Error('gone'));
      await expect(service.deleteFile('images/abc.webp')).resolves.toBeUndefined();
    });
  });
});