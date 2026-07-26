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
  cors: { origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true },
  namespace: '/auctions',
})
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    client.join(roomId);
    client.emit('joinedRoom', { roomId, message: `Joined room ${roomId}` });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    client.leave(roomId);
    client.emit('leftRoom', { roomId, message: `Left room ${roomId}` });
  }

  broadcastNewBid(productId: string, bid: any) {
    this.server.emit('newBid', { productId, bid });
  }

  broadcastBidUpdate(productId: string, data: { currentBid: number; totalBids: number }) {
    this.server.emit('bidUpdate', { productId, ...data });
  }

  broadcastAuctionEnd(productId: string, winner: any) {
    this.server.emit('auctionEnd', { productId, winner });
  }
}
