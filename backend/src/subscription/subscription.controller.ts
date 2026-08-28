import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { SubscribeDto } from './dto/subscribe.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Subscribe an email (double opt-in)' })
  async subscribe(@Body() dto: SubscribeDto) {
    const sub = await this.service.subscribe(dto.email);
    return { success: true, data: { email: sub.email, status: sub.status } };
  }

  @Get('confirm')
  @ApiOperation({ summary: 'Confirm a subscription from the opt-in link' })
  async confirm(@Query('token') token: string) {
    const sub = await this.service.confirm(token);
    return { success: true, data: { email: sub.email, status: sub.status } };
  }

  @Post('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe an email' })
  async unsubscribe(@Body() dto: SubscribeDto) {
    return this.service.unsubscribe(dto.email);
  }
}
