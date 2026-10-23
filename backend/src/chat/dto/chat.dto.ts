import { IsUUID, IsOptional, IsString, IsEnum, IsNumber, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../entities/chat.entity';

export class CreateConversationDto {
  @ApiProperty({ example: 'uuid-of-other-participant' })
  @IsUUID()
  participantId: string;

  @ApiPropertyOptional({ example: 'uuid-of-product' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: 'Question about 2019 Toyota Hilux' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({ enum: ['buyer_seller', 'support', 'dispute'], default: 'buyer_seller' })
  @IsOptional()
  @IsEnum(['buyer_seller', 'support', 'dispute'])
  type?: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Hello, I am interested in your listing.' })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/bucket/image.jpg' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'image.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 2048576 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  fileSize?: number;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateMessageDto extends SendMessageDto {
  @ApiProperty({ example: 'uuid-of-conversation' })
  @IsUUID()
  conversationId: string;
}

export class UpdateMessageDto {
  @ApiPropertyOptional({ example: 'Updated message content' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;
}