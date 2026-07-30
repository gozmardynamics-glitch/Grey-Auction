import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowTrigger } from '../entities/agent-workflow.entity';

export class CreateToolDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() displayName: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() category: string;
  @ApiProperty() @IsString() endpoint: string;
  @ApiProperty({ default: 'GET' }) @IsOptional() @IsString() httpMethod?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() inputSchema?: Record<string, unknown>;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() outputSchema?: Record<string, unknown>;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() headers?: Record<string, string>;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() examples?: Record<string, unknown>[];
  @ApiProperty({ default: true }) @IsOptional() @IsBoolean() isEnabled?: boolean;
  @ApiProperty({ default: false }) @IsOptional() @IsBoolean() requiresAuth?: boolean;
  @ApiProperty({ default: 15000 }) @IsOptional() @IsNumber() timeoutMs?: number;
}

export class CreateWorkflowDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() displayName: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: WorkflowTrigger, default: WorkflowTrigger.MANUAL }) @IsOptional() @IsEnum(WorkflowTrigger) trigger?: WorkflowTrigger;
  @ApiProperty({ required: false }) @IsOptional() @IsString() triggerEvent?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cronExpression?: string;
  @ApiProperty() @IsArray() steps: Record<string, unknown>[];
  @ApiProperty({ default: true }) @IsOptional() @IsBoolean() isEnabled?: boolean;
}

export class UpdateWorkflowDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() displayName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() triggerEvent?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cronExpression?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() steps?: Record<string, unknown>[];
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isEnabled?: boolean;
}
