import {
  IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, MaxLength, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryMethod } from '../entities/shipment.entity';

export class CreateAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  recipientName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  phone: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  line1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;
}

export class CalculateRateDto {
  @ApiProperty({ enum: DeliveryMethod })
  @IsEnum(DeliveryMethod)
  method: DeliveryMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;
}

export class CreateShipmentDto {
  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({ enum: DeliveryMethod })
  @IsEnum(DeliveryMethod)
  method: DeliveryMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  carrier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}

export class UpdateShipmentStatusDto {
  @ApiProperty()
  @IsString()
  @MaxLength(30)
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  trackingNumber?: string;
}
