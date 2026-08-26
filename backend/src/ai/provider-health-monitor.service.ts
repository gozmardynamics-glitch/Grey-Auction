import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AIService } from './ai.service';

/**
 * Periodic LLM provider monitoring.
 * Sweeps all active providers every 5 minutes: connectivity is tested with the
 * protocol-appropriate request and health/latency are persisted, so the admin
 * UI always shows live connection status.
 */
@Injectable()
export class ProviderHealthMonitorService {
  private readonly logger = new Logger(ProviderHealthMonitorService.name);

  constructor(private readonly aiService: AIService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep() {
    this.logger.log('Running scheduled LLM provider health sweep...');
    const results = await this.aiService.monitorSweep();
    const ok = results.filter((r) => r.ok).length;
    this.logger.log('Health sweep done: ' + results.length + ' providers - ' + ok + ' ok, ' + (results.length - ok) + ' degraded/down');
  }
}