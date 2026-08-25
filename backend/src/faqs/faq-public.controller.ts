import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FaqService } from './faq.service';

/**
 * Public FAQ endpoints (no auth) used by the marketing FAQ page.
 */
@ApiTags('FAQs (public)')
@Controller('faqs')
export class FaqPublicController {
  constructor(private readonly service: FaqService) {}

  @Get()
  @ApiOperation({ summary: 'List public FAQs' })
  async findAll() {
    const data = await this.service.findAll();
    return { success: true, data };
  }
}
