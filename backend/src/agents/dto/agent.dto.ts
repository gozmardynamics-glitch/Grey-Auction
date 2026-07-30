import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AgentCategory } from '../entities/agent-instance.entity';

export class CreateAgentDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() displayName: string;
  @ApiProperty({ required: false, enum: AgentCategory, default: AgentCategory.CUSTOM })
  @IsOptional() @IsEnum(AgentCategory) category?: AgentCategory;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() systemPrompt?: string;
  @ApiProperty({ required: false, default: 'gpt-4o-mini' }) @IsOptional() @IsString() modelId?: string;
  @ApiProperty({ required: false, default: 'openai' }) @IsOptional() @IsString() providerName?: string;
  @ApiProperty({ required: false, default: 0.7 }) @IsOptional() @IsNumber() temperature?: number;
  @ApiProperty({ required: false, default: 2048 }) @IsOptional() @IsNumber() maxTokens?: number;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() toolIds?: string[];
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() triggerEvents?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsObject() config?: Record<string, unknown>;
  @ApiProperty({ required: false, default: true }) @IsOptional() @IsBoolean() isEnabled?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() mcpEndpoint?: string;
  @ApiProperty({ required: false, default: 60000 }) @IsOptional() @IsNumber() timeoutMs?: number;
  @ApiProperty({ required: false, default: 3 }) @IsOptional() @IsNumber() maxRetries?: number;
}

export class UpdateAgentDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() displayName?: string;
  @ApiProperty({ required: false, enum: AgentCategory }) @IsOptional() @IsEnum(AgentCategory) category?: AgentCategory;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() systemPrompt?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() modelId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() providerName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() temperature?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() maxTokens?: number;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() toolIds?: string[];
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() triggerEvents?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsObject() config?: Record<string, unknown>;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isEnabled?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() mcpEndpoint?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() timeoutMs?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() maxRetries?: number;
}
