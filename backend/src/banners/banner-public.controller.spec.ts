import { Test, TestingModule } from '@nestjs/testing';
import { BannerPublicController } from './banner-public.controller';
import { BannerService } from './banner.service';

describe('BannerPublicController', () => {
  it('should return public banners', async () => {
    const service = { findAll: jest.fn().mockResolvedValue([{ id: 'b1' }]) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannerPublicController],
      providers: [{ provide: BannerService, useValue: service }],
    }).compile();
    const controller = module.get<BannerPublicController>(BannerPublicController);
    const res = await controller.findAll();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });
});
