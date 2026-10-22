import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { TicketService } from './ticket.service';

class ContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MaxLength(255)
  subject: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message: string;
}

/**
 * Public contact form endpoint.
 *
 * Messages land in the support ticket queue so agents answer them from the
 * existing admin tickets screen — no separate inbox to maintain.
 */
@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // Per-IP throttle: a public, unauthenticated write endpoint.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Send a contact message (creates a support ticket)' })
  async submit(@Body() dto: ContactDto) {
    const ticket = await this.ticketService.create({
      subject: dto.subject,
      description: dto.message,
      userId: `guest:${dto.email}`,
      userName: dto.name,
      userEmail: dto.email,
      status: 'open' as any,
      messages: [],
    } as any);

    return {
      success: true,
      message: 'Thanks — our team will get back to you shortly.',
      data: { id: (ticket as any)?.id ?? null },
    };
  }
}
