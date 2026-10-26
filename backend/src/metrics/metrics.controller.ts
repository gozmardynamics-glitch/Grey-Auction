import { Controller, ForbiddenException, Get, Headers, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus scrape endpoint.
   *
   * Metrics expose business gauges (revenue, active users), so when
   * METRICS_TOKEN is configured a scrape must present it — as a bearer token or
   * a ?token= query param (Prometheus scrape_configs cannot always set headers).
   * With no token configured the endpoint stays open for local use and the
   * deployment is expected to keep it on an internal interface.
   */
  @Get()
  @ApiOperation({ summary: 'Get Prometheus metrics (token required when METRICS_TOKEN is set)' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics in text format' })
  async getMetrics(
    @Res() res: Response,
    @Headers('authorization') authorization?: string,
    @Query('token') token?: string,
  ): Promise<void> {
    const expected = process.env.METRICS_TOKEN;
    if (expected) {
      const bearer = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : undefined;
      if (bearer !== expected && token !== expected) {
        throw new ForbiddenException('Metrics require a valid scrape token');
      }
    }

    const metrics = await this.metricsService.getMetrics();
    const contentType = await this.metricsService.getContentType();
    res.set('Content-Type', contentType);
    res.send(metrics);
  }
}
