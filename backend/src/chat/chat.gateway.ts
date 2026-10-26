import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';

import { Conversation } from './entities/chat.entity';
import { RealtimeService } from '../realtime/realtime.service';

export const conversationRoom = (conversationId: string) => 'conversation:' + conversationId;

/**
 * Chat delivery over WebSocket.
 *
 * The socket authenticates with the short-lived ticket from POST /realtime/ticket
 * (the browser holds no API token), then auto-joins every conversation the user
 * participates in, so a new message reaches the other side without a refetch.
 */
@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim()),
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly realtime: RealtimeService,
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const ticket = client.handshake.auth?.ticket ?? client.handshake.query?.ticket;
    const userId = this.realtime.verify(ticket);
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;

    try {
      const rooms = await this.conversations.find({
        where: [
          { participant1Id: userId, isActive: true },
          { participant2Id: userId, isActive: true },
        ],
        select: ['id'],
      });
      for (const conversation of rooms) {
        await client.join(conversationRoom(conversation.id));
      }
      client.emit('ready', { conversations: rooms.map((c) => c.id) });
    } catch (error: any) {
      // A socket that cannot enumerate its rooms is still authenticated; it
      // simply will not receive live messages until it reconnects.
      this.logger.warn('Could not join conversation rooms: ' + (error?.message ?? error));
    }
  }

  handleDisconnect(_client: Socket): void {
    // socket.io leaves rooms automatically on disconnect.
  }

  /** Fan a saved message out to everyone in that conversation. */
  emitMessage(conversationId: string, message: Record<string, unknown>): void {
    if (!this.server) return;
    this.server.to(conversationRoom(conversationId)).emit('newMessage', message);
  }
}
