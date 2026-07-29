import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIUsageLog } from '../../../ai/entities/ai-usage-log.entity';

@Injectable()
export class AIUsageLogService {
  private readonly logger = new Logger(AIUsageLogService.name);

  constructor(
    @InjectRepository(AIUsageLog) private readonly usageRepo: Repository<AIUsageLog>,
  ) {}

  async log(data: {
    featureKey: string;
    modelId?: string;
    providerName?: string;
    userId?: string;
    promptTokens?: number;
    completionTokens?: number;
    estimatedCost?: number;
    latencyMs?: number;
    success: boolean;
    errorMessage?: string;
    attemptNumber?: number;
  }) {
    try {
      await this.usageRepo.save(this.usageRepo.create(data));
    } catch (err) {
      this.logger.error(`Failed to log AI usage: ${(err as Error).message}`);
    }
  }
}
