import { IsUUID, IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiProperty({ enum: AuditAction, example: AuditAction.CREATE })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({ enum: AuditEntityType, example: AuditEntityType.PRODUCT })
  @IsEnum(AuditEntityType)
  entityType: AuditEntityType;

  @ApiPropertyOptional({ example: 'uuid-of-entity' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, example: { name: 'old name' } })
  @IsOptional()
  @IsObject()
  oldValues?: Record<string, any>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, example: { name: 'new name' } })
  @IsOptional()
  @IsObject()
  newValues?: Record<string, any>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, example: { source: 'admin_panel' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AuditLogQueryDto {
  @ApiPropertyOptional({ example: 'uuid-of-user' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ enum: AuditEntityType })
  @IsOptional()
  @IsEnum(AuditEntityType)
  entityType?: AuditEntityType;

  @ApiPropertyOptional({ example: 'uuid-of-entity' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-01-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  limit?: number;
}