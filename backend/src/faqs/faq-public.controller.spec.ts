import { Test, TestingModule } from '@nestjs/testing';
import { FaqPublicController } from './faq-public.controller';
import { FaqService } from './faq.service';

describe('FaqPublicController', () => {
  it('should return public FAQs', async () => {
    const service = { findAll: jest.fn().mockResolvedValue([{ id: 'f1' }]) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaqPublicController],
      providers: [{ provide: FaqService, useValue: service }],
    }).compile();
    const controller = module.get<FaqPublicController>(FaqPublicController);
    const res = await controller.findAll();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });
});
