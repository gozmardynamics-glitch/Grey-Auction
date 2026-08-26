import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus, RoomParticipant } from './entities/room.entity';
import { AuctionGateway } from '../bids/gateways/auction.gateway';
import { NotificationService } from '../notification/notification.service';

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
    @InjectRepository(RoomParticipant)
    @Optional() private readonly participantRepo?: Repository<RoomParticipant>,
    @Optional() private readonly notifications?: NotificationService,
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
        await this.notifyRoomStart(room);
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

  /**
   * Notify room participants (and the creator) that the auction room is live.
   * Fire-and-forget so a notification failure never breaks the lifecycle cron.
   */
  private async notifyRoomStart(room: Room): Promise<void> {
    if (!this.notifications) return;
    const recipients = new Set<string>();
    if (this.participantRepo) {
      const participants = await this.participantRepo.find({
        where: { roomId: room.id },
      });
      for (const participant of participants) recipients.add(participant.userId);
    }
    if (room.createdById) recipients.add(room.createdById);
    if (recipients.size === 0) return;

    const link = '/room/' + room.id;
    for (const userId of recipients) {
      void this.notifications
        .notifyRoomStarted(userId, {
          roomName: room.name ?? 'Auction room',
          roomId: room.id,
          link,
        })
        .catch(() => undefined);
    }
  }
}
