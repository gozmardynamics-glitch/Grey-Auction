import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { AuctionGateway } from '../bids/gateways/auction.gateway';

/**
 * Automated bidding-room lifecycle.
 * Runs every minute: SCHEDULED rooms whose startTime has passed go LIVE;
 * LIVE rooms whose endTime has passed go CLOSED. Status changes are
 * broadcast over the real-time gateway.
 */
@Injectable()
export class RoomLifecycleService {
  private readonly logger = new Logger(RoomLifecycleService.name);

  constructor(
    @InjectRepository(Room)
    private readonly repo: Repository<Room>,
    @Optional() private readonly gateway?: AuctionGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    const now = new Date();

    const started = await this.repo.find({
      where: { status: RoomStatus.SCHEDULED },
    });
    for (const room of started) {
      if (room.startTime <= now) {
        room.status = RoomStatus.LIVE;
        await this.repo.save(room);
        this.logger.log(`Room started: ${room.roomCode} (${room.id})`);
        this.gateway?.broadcastRoomStarted(room.id);
      }
    }

    const closing = await this.repo.find({
      where: { status: RoomStatus.LIVE },
    });
    for (const room of closing) {
      if (room.endTime <= now) {
        room.status = RoomStatus.CLOSED;
        await this.repo.save(room);
        this.logger.log(`Room closed: ${room.roomCode} (${room.id})`);
        this.gateway?.broadcastRoomEnded(room.id);
      }
    }
  }
}
