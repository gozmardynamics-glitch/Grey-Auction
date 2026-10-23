import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'List conversations for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.service.listConversations(user.id, page || 1, limit || 20);
    return { success: true, ...data };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  async unreadCount(@CurrentUser() user: any) {
    const count = await this.service.getUnreadCount(user.id);
    return { success: true, data: { count } };
  }

  @Post()
  @ApiOperation({ summary: 'Create or find existing conversation' })
  async create(@CurrentUser() user: any, @Body() dto: CreateConversationDto) {
    const data = await this.service.findOrCreateConversation(user.id, dto);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async get(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.service.getConversation(id, user.id, page || 1, limit || 50);
    return { success: true, data };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.service.getMessages(id, user.id, page || 1, limit || 50);
    return { success: true, data };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async sendMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const data = await this.service.sendMessage(id, user.id, dto);
    return { success: true, data };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark conversation messages as read' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    await this.service.markAsRead(id, user.id);
    return { success: true, message: 'Messages marked as read' };
  }
}