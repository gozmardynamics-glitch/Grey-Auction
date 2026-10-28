import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TicketCategory } from './ticket.entity';
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

  /**
   * Which area the message is about ("Bidding and auctions", "Seller payouts"…).
   * Optional so an older client keeps working; mapped to a TicketCategory and
   * from there to a severity and a resolution deadline.
   */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  topic?: string;
}

/** The contact form's human labels, mapped onto the complaint taxonomy. */
const TOPIC_TO_CATEGORY: Array<[RegExp, TicketCategory]> = [
  [/bid|auction/i, TicketCategory.BIDDING],
  [/payment|invoice/i, TicketCategory.PAYMENTS],
  [/escrow|refund|dispute/i, TicketCategory.ESCROW],
  [/payout/i, TicketCategory.PAYOUTS],
  [/listing|condition|accuracy/i, TicketCategory.LISTING],
  [/delivery|collection/i, TicketCategory.DELIVERY],
  [/account|verification|access|sign/i, TicketCategory.ACCOUNT],
  [/data protection|privacy|gdpr|ndpa/i, TicketCategory.DATA_PROTECTION],
];

function categoryForTopic(topic?: string): TicketCategory {
  if (!topic) return TicketCategory.OTHER;
  const match = TOPIC_TO_CATEGORY.find(([pattern]) => pattern.test(topic));
  return match ? match[1] : TicketCategory.OTHER;
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
      category: categoryForTopic(dto.topic),
      source: 'contact_form',
      description: dto.message,
      userId: `guest:${dto.email}`,
      userName: dto.name,
      userEmail: dto.email,
    });

    // The reference is the whole point of the acknowledgement: the policy promises
    // one, so it is returned to the form as well as emailed.
    return {
      success: true,
      message: `Thanks — we have your message. Your reference is ${ticket.reference}.`,
      data: { id: ticket.id, reference: ticket.reference },
    };
  }
}
