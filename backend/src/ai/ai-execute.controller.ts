import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AIOrchestratorService } from '../common/ai/services/ai-orchestrator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ExecuteAIDto {
  @ApiProperty()
  @IsString()
  featureKey: string;

  @ApiProperty()
  @IsObject()
  input: Record<string, unknown>;
}

@ApiTags('AI Execute')
@Controller('ai')
export class AIExecuteController {
  constructor(private readonly orchestrator: AIOrchestratorService) {}

  @Post('execute')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Execute an AI feature' })
  async execute(@Body() dto: ExecuteAIDto, @Req() req: any) {
    const result = await this.orchestrator.execute(
      dto.featureKey,
      { messages: [], prompt: JSON.stringify(dto.input) },
      req.user?.id,
    );
    return { success: true, data: result };
  }
}

@ApiTags('AI Execute')
@Controller('ai')
export class AIPublicExecuteController {
  constructor(private readonly orchestrator: AIOrchestratorService) {}

  @Post('public/execute')
  @ApiOperation({ summary: 'Execute an AI feature (public, no auth required)' })
  async execute(@Body() dto: ExecuteAIDto) {
    const result = await this.orchestrator.execute(
      dto.featureKey,
      { messages: [], prompt: JSON.stringify(dto.input) },
    );
    return { success: true, data: result };
  }
}
