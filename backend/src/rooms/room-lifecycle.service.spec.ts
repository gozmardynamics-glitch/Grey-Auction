import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomLifecycleService } from './room-lifecycle.service';
import { Room, RoomStatus, RoomParticipant } from './entities/room.entity';
import { AuctionGateway } from '../bids/gateways/auction.gateway';
import { NotificationService } from '../notification/notification.service';

describe('RoomLifecycleService', () => {
  let service: RoomLifecycleService;
  const repo = {
    find: jest.fn(),
    save: jest.fn(),
  };
  const gateway = {
    broadcastRoomStarted: jest.fn(),
    broadcastRoomEnded: jest.fn(),
  };
  const participantRepo = {
    find: jest.fn().mockResolvedValue([]),
  };
  const notificationMock = {
    notifyRoomStarted: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomLifecycleService,
        { provide: getRepositoryToken(Room), useValue: repo },
        { provide: getRepositoryToken(RoomParticipant), useValue: participantRepo },
        { provide: AuctionGateway, useValue: gateway },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();
    service = module.get<RoomLifecycleService>(RoomLifecycleService);
  });

  it('starts scheduled rooms whose startTime has passed', async () => {
    const room = {
      id: 'r1',
      roomCode: 'RM-1',
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 3600000),
      status: RoomStatus.SCHEDULED,
    };
    (repo.find as jest.Mock).mockResolvedValueOnce([room]).mockResolvedValueOnce([]);
    (repo.save as jest.Mock).mockResolvedValue(room);

    await service.tick();

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1', status: RoomStatus.LIVE }),
    );
    expect(gateway.broadcastRoomStarted).toHaveBeenCalledWith('r1');
  });

  it('does not start scheduled rooms that are still in the future', async () => {
    const room = {
      id: 'r2',
      roomCode: 'RM-2',
      startTime: new Date(Date.now() + 3600000),
      endTime: new Date(Date.now() + 7200000),
      status: RoomStatus.SCHEDULED,
    };
    (repo.find as jest.Mock).mockResolvedValueOnce([room]).mockResolvedValueOnce([]);

    await service.tick();

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('closes live rooms whose endTime has passed', async () => {
    const room = {
      id: 'r3',
      roomCode: 'RM-3',
      startTime: new Date(Date.now() - 7200000),
      endTime: new Date(Date.now() - 1000),
      status: RoomStatus.LIVE,
    };
    (repo.find as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([room]);
    (repo.save as jest.Mock).mockResolvedValue(room);

    await service.tick();

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r3', status: RoomStatus.CLOSED }),
    );
    expect(gateway.broadcastRoomEnded).toHaveBeenCalledWith('r3');
  });

  it('notifies room participants and the creator when a room goes live', async () => {
    const room = {
      id: 'r1',
      roomCode: 'RM-1',
      name: 'Draft Auctions',
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 3600000),
      status: RoomStatus.SCHEDULED,
      createdById: 'seller-1',
    };
    (repo.find as jest.Mock).mockResolvedValueOnce([room]).mockResolvedValueOnce([]);
    (repo.save as jest.Mock).mockResolvedValue(room);
    (participantRepo.find as jest.Mock).mockResolvedValue([
      { roomId: 'r1', userId: 'buyer-1' },
      { roomId: 'r1', userId: 'buyer-2' },
    ]);

    await service.tick();

    expect(notificationMock.notifyRoomStarted).toHaveBeenCalledWith(
      'buyer-1',
      expect.objectContaining({ roomId: 'r1' }),
    );
    expect(notificationMock.notifyRoomStarted).toHaveBeenCalledWith(
      'buyer-2',
      expect.objectContaining({ roomId: 'r1' }),
    );
    expect(notificationMock.notifyRoomStarted).toHaveBeenCalledWith(
      'seller-1',
      expect.objectContaining({ roomId: 'r1' }),
    );
  });
});
