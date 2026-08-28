import {
  IsString, IsEnum, IsOptional, IsArray, IsIn, IsInt, Min, Max, ValidateNested, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LotCondition, ConditionGrade } from '../entities/condition-report.entity';
import { DisputeReason, DisputeStatus } from '../entities/dispute.entity';

export class DefectDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  part: string;

  @ApiProperty({ enum: ['minor', 'major', 'critical'] })
  @IsIn(['minor', 'major', 'critical'])
  severity: 'minor' | 'major' | 'critical';

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  description: string;
}

export class CreateConditionReportDto {
  @ApiProperty({ enum: LotCondition })
  @IsEnum(LotCondition)
  condition: LotCondition;

  @ApiProperty({ enum: ConditionGrade })
  @IsEnum(ConditionGrade)
  grade: ConditionGrade;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  summary: string;

  @ApiPropertyOptional({ type: [DefectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefectDto)
  defects?: DefectDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  inspectedAtLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reporterName?: string;
}

export class CreateDisputeDto {
  @ApiProperty({ enum: DisputeReason })
  @IsEnum(DisputeReason)
  reason: DisputeReason;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  againstUserId?: string;
}

export class UpdateDisputeStatusDto {
  @ApiProperty({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  status: DisputeStatus;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED] })
  @IsIn([DisputeStatus.RESOLVED, DisputeStatus.REJECTED])
  outcome: DisputeStatus.RESOLVED | DisputeStatus.REJECTED;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  resolution: string;
}

export class DisputeFeedbackDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
