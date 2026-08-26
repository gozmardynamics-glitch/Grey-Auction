import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from './notification.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  const repo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const notification = {
    id: 'n1',
    userId: 'u1',
    type: NotificationType.SYSTEM,
    title: 'Welcome',
    body: 'Body text',
    link: '/auctions/1',
    isRead: false,
    createdAt: new Date(),
  } as unknown as Notification;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(Notification), useValue: repo },
      ],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
  });

  it('create saves a notification for the user', async () => {
    (repo.create as jest.Mock).mockReturnValue(notification);
    (repo.save as jest.Mock).mockResolvedValue(notification);

    const result = await service.create('u1', {
      type: NotificationType.SYSTEM,
      title: 'Welcome',
      body: 'Body text',
      link: '/auctions/1',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        type: NotificationType.SYSTEM,
        title: 'Welcome',
        body: 'Body text',
        link: '/auctions/1',
      }),
    );
    expect(repo.save).toHaveBeenCalledWith(notification);
    expect(result).toBe(notification);
  });

  it('list passes take/skip for pagination newest-first', async () => {
    (repo.find as jest.Mock).mockResolvedValue([notification]);

    await service.list('u1', { page: 2, limit: 10 });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 10,
      }),
    );
  });

  it('list defaults take to 50 and page to 1', async () => {
    (repo.find as jest.Mock).mockResolvedValue([]);

    await service.list('u1');

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50, skip: 0 }),
    );
  });

  it('unreadCount returns the count of unread notifications', async () => {
    (repo.count as jest.Mock).mockResolvedValue(3);

    const result = await service.unreadCount('u1');

    expect(result).toBe(3);
    expect(repo.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', isRead: false } }),
    );
  });

  it('markRead throws NotFound for an unknown notification', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.markRead('nope', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('markRead throws BadRequest when the notification belongs to another user', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ ...notification, userId: 'u2' });

    await expect(service.markRead('n1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('markRead marks the owner notification as read', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(notification);
    (repo.save as jest.Mock).mockImplementation(async (n) => n);

    const result = await service.markRead('n1', 'u1');

    expect(result.isRead).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(notification);
  });

  it('markAllRead updates all unread notifications for the user', async () => {
    (repo.update as jest.Mock).mockResolvedValue({ affected: 5 });

    const result = await service.markAllRead('u1');

    expect(repo.update).toHaveBeenCalledWith(
      { userId: 'u1', isRead: false },
      { isRead: true },
    );
    expect(result.updated).toBe(5);
  });

  describe('trigger helpers', () => {
    beforeEach(() => {
      (repo.create as jest.Mock).mockReturnValue(notification);
      (repo.save as jest.Mock).mockResolvedValue(notification);
    });

    it('notifyOutbid creates a BID_OUTBID notification with a public link', async () => {
      await service.notifyOutbid('u1', { auctionTitle: 'iPhone', auctionId: 'a1' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          type: NotificationType.BID_OUTBID,
          link: '/auctions/a1',
        }),
      );
    });

    it('notifyAuctionWon creates an AUCTION_WON notification with the hammer price', async () => {
      await service.notifyAuctionWon('u1', {
        auctionTitle: 'iPhone',
        auctionId: 'a1',
        hammerPrice: 50000,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          type: NotificationType.AUCTION_WON,
          link: '/auctions/a1',
        }),
      );
      const dto = (repo.create as jest.Mock).mock.calls[0][0] as any;
      expect(dto.body).toContain('NGN');
    });

    it('notifyAuctionEnded creates an AUCTION_ENDED notification for the seller', async () => {
      await service.notifyAuctionEnded('s1', { auctionTitle: 'iPhone', auctionId: 'a1' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 's1',
          type: NotificationType.AUCTION_ENDED,
          link: '/auctions/a1',
        }),
      );
    });

    it('notifyRoomStarted creates a ROOM_STARTED notification with the room link', async () => {
      await service.notifyRoomStarted('u1', { roomName: 'Live Room', roomId: 'r1' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          type: NotificationType.ROOM_STARTED,
          link: '/room/r1',
        }),
      );
    });
  });
});
