import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export interface NotificationListOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(userId: string, dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.repo.create({
      userId,
      type: dto.type,
      title: dto.title,
      body: dto.body ?? null,
      link: dto.link ?? null,
    } as Notification);
    return this.repo.save(notification);
  }

  async list(
    userId: string,
    opts: NotificationListOptions = {},
  ): Promise<Notification[]> {
    const limit = opts.limit || 50;
    const page = opts.page || 1;
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new BadRequestException('Not your notification');
    }
    notification.isRead = true;
    return this.repo.save(notification);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.repo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { updated: result.affected ?? 0 };
  }

  // ─── Concrete trigger helpers ────────────────────────────────────
  // These build the title/body/link for the standardized events and
  // keep the message copy in one place. Callers pass an optional
  // explicit link (e.g. a public slug); otherwise it is derived from id.

  async notifyOutbid(
    userId: string,
    data: { auctionTitle: string; auctionId: string; link?: string },
  ): Promise<Notification> {
    return this.create(userId, {
      type: NotificationType.BID_OUTBID,
      title: 'You’ve been outbid',
      body: `Someone placed a higher bid on “${data.auctionTitle}”.`,
      link: data.link ?? `/auctions/${data.auctionId}`,
    });
  }

  async notifyAuctionWon(
    userId: string,
    data: { auctionTitle: string; auctionId: string; hammerPrice?: number; link?: string },
  ): Promise<Notification> {
    return this.create(userId, {
      type: NotificationType.AUCTION_WON,
      title: 'You won this auction',
      body:
        data.hammerPrice != null
          ? `Congratulations! You won “${data.auctionTitle}” for ${data.hammerPrice.toLocaleString()} NGN.`
          : `Congratulations! You won “${data.auctionTitle}”.`,
      link: data.link ?? `/auctions/${data.auctionId}`,
    });
  }

  async notifyAuctionEnded(
    userId: string,
    data: { auctionTitle: string; auctionId: string; link?: string },
  ): Promise<Notification> {
    return this.create(userId, {
      type: NotificationType.AUCTION_ENDED,
      title: 'Your auction has ended',
      body: `“${data.auctionTitle}” has ended.`,
      link: data.link ?? `/auctions/${data.auctionId}`,
    });
  }

  async notifyRoomStarted(
    userId: string,
    data: { roomName: string; roomId: string; link?: string },
  ): Promise<Notification> {
    return this.create(userId, {
      type: NotificationType.ROOM_STARTED,
      title: 'Auction room is live',
      body: `The auction room “${data.roomName}” is now open for bidding.`,
      link: data.link ?? `/room/${data.roomId}`,
    });
  }
}
