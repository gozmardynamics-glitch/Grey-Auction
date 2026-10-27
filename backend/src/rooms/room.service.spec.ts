import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { RoomService } from './room.service';
import {
  Room,
  RoomParticipant,
  RoomStatus,
  RoomType,
} from './entities/room.entity';
import { InviteService } from '../invites/invite.service';

describe('RoomService access control', () => {
  let service: RoomService;
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const participantRepo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
  const inviteService = { redeemForRoom: jest.fn() };

  const privateRoom = {
    id: 'room-1',
    name: 'Private sale',
    type: RoomType.PRIVATE,
    status: RoomStatus.SCHEDULED,
    createdById: 'seller-1',
    invitedUserIds: ['invited-1'],
    inviteCode: 'SECRET',
    startTime: new Date(),
    endTime: new Date(),
    productIds: [],
  } as unknown as Room;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: getRepositoryToken(Room), useValue: repo },
        { provide: getRepositoryToken(RoomParticipant), useValue: participantRepo },
        { provide: InviteService, useValue: inviteService },
      ],
    }).compile();
    service = module.get<RoomService>(RoomService);
    (repo.findOne as jest.Mock).mockResolvedValue(privateRoom);
  });

  it('refuses an anonymous caller', async () => {
    await expect(service.findForViewer('room-1')).rejects.toThrow(ForbiddenException);
  });

  it('refuses a signed-in buyer who was never invited', async () => {
    (participantRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.findForViewer('room-1', { id: 'stranger', role: 'bidder' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('admits an invited bidder', async () => {
    const room = await service.findForViewer('room-1', { id: 'invited-1', role: 'bidder' });
    expect(room.id).toBe('room-1');
  });

  it('admits the owner and keeps the join code for them', async () => {
    const room = await service.findForViewer('room-1', { id: 'seller-1', role: 'seller' });
    expect(room.inviteCode).toBe('SECRET');
  });

  it('admits an administrator for oversight, without the join code', async () => {
    // Regression: the private-room gate applied to admins too, so an admin got
    // 403 on every private room they were asked to review.
    const room = await service.findForViewer('room-1', { id: 'admin-1', role: 'admin' });
    expect(room.id).toBe('room-1');
    expect(room.inviteCode).toBeUndefined();
    expect(room.invitedUserIds).toBeUndefined();
  });

  it('gives participants of a private room the member list', async () => {
    (participantRepo.find as jest.Mock).mockResolvedValue([{ userId: 'invited-1' }]);

    const rows = await service.getParticipants('room-1', { id: 'invited-1', role: 'bidder' });

    expect(rows).toHaveLength(1);
  });

  it('hides the member list of a private room from outsiders', async () => {
    (participantRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.getParticipants('room-1', { id: 'stranger', role: 'bidder' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('redeems an invite token to admit a bidder and records the admission', async () => {
    (participantRepo.findOne as jest.Mock).mockResolvedValue(null);
    (participantRepo.create as jest.Mock).mockImplementation(async (x: any) => x);
    (participantRepo.save as jest.Mock).mockImplementation(async (x: any) => x);

    const participant = await service.joinRoom(
      'room-1',
      { id: 'buyer-1', email: 'buyer@example.com' },
      { inviteToken: 'tok-1' },
    );

    expect(inviteService.redeemForRoom).toHaveBeenCalledWith('tok-1', 'room-1', {
      id: 'buyer-1',
      email: 'buyer@example.com',
    });
    expect(repo.update).toHaveBeenCalledWith('room-1', {
      invitedUserIds: ['invited-1', 'buyer-1'],
    });
    expect(participant).toMatchObject({ roomId: 'room-1', userId: 'buyer-1' });
  });

  it('refuses a private room join with no credential at all', async () => {
    (participantRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.joinRoom('room-1', { id: 'buyer-1' }, {}),
    ).rejects.toThrow(/requires an invite/);
    expect(inviteService.redeemForRoom).not.toHaveBeenCalled();
  });
});
