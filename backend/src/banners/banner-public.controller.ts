import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BannerService } from './banner.service';

/**
 * Public banner endpoints (no auth) used by the homepage.
 */
@ApiTags('Banners (public)')
@Controller('banners')
export class BannerPublicController {
  constructor(private readonly service: BannerService) {}

  @Get()
  @ApiOperation({ summary: 'List public banners' })
  async findAll() {
    const data = await this.service.findAll();
    return { success: true, data };
  }
}
