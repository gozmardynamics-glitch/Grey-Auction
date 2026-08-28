import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdvisorService } from './advisor.service';
import { AdvisorType } from './entities/advisor.entity';

@ApiTags('Advisors')
@Controller('advisors')
export class AdvisorController {
  constructor(private readonly service: AdvisorService) {}

  @Get()
  @ApiOperation({ summary: 'List marketplace advisors (filterable by country/region/type)' })
  async list(
    @Query('country') country?: string,
    @Query('region') region?: string,
    @Query('type') type?: AdvisorType,
  ) {
    const data = await this.service.list({ country, region, type });
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Advisor detail' })
  async one(@Param('id') id: string) {
    const data = await this.service.get(id);
    return { success: true, data };
  }
}
