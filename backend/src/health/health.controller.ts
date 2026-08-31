import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Liveness probe (no DB dependency). Used by load balancers, health checks,
 * and the E2E smoke test. Returns app version + uptime.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  health() {
    return {
      success: true,
      status: 'ok',
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
