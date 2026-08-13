import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim()), credentials: true },
  namespace: '/auctions',
})
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (!token) {
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket) {
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string; token?: string }) {
    const roomId = typeof data === 'string' ? data : data.roomId;
    client.join(roomId);
    client.emit('joinedRoom', { roomId, message: `Joined room ${roomId}` });
    // Notify others in the room
    client.to(roomId).emit('participantJoined', { roomId, userId: (client as any).userId || 'anonymous' });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    client.leave(roomId);
    client.emit('leftRoom', { roomId, message: `Left room ${roomId}` });
    client.to(roomId).emit('participantLeft', { roomId, userId: (client as any).userId || 'anonymous' });
  }

  // ─── Room lifecycle broadcasts ──────────────────────────────────
  broadcastRoomStarted(roomId: string) {
    this.server.to(roomId).emit('roomStarted', { roomId });
  }

  broadcastRoomEnding(roomId: string, minutesLeft: number) {
    this.server.to(roomId).emit('roomEnding', { roomId, minutesLeft });
  }

  broadcastRoomEnded(roomId: string) {
    this.server.to(roomId).emit('roomEnded', { roomId });
  }

  broadcastRoomCancelled(roomId: string, reason?: string) {
    this.server.to(roomId).emit('roomCancelled', { roomId, reason });
  }

  broadcastDepositRequest(roomId: string, amount: number) {
    this.server.to(roomId).emit('depositRequest', { roomId, amount });
  }

  broadcastNewBid(productId: string, bid: any, visibility: 'public' | 'private' = 'public', sellerId?: string, bidderId?: string) {
    if (visibility === 'private') {
      if (sellerId) this.server.to(productId).emit('newBid', { productId, bid });
      if (bidderId) {
        const bidderSocket = Array.from(this.server.sockets.sockets.values())
          .find((s) => (s as any).userId === bidderId);
        if (bidderSocket) bidderSocket.emit('newBid', { productId, bid });
      }
    } else {
      this.server.to(productId).emit('newBid', { productId, bid });
    }
  }

  broadcastBidUpdate(productId: string, data: { currentBid: number; totalBids: number }, visibility: 'public' | 'private' = 'public', sellerId?: string) {
    if (visibility === 'private') {
      if (sellerId) this.server.to(productId).emit('bidUpdate', { productId, ...data });
    } else {
      this.server.to(productId).emit('bidUpdate', { productId, ...data });
    }
  }

  broadcastAuctionEnd(productId: string, winner: any) {
    this.server.to(productId).emit('auctionEnd', { productId, winner });
  }
}
