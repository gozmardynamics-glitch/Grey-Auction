import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InviteService } from './invite.service';
import { Invite, InviteMode, InviteResponse } from './invite.entity';
import { Room } from '../rooms/entities/room.entity';
import { EmailService } from '../common/email/email.service';
import { SmsService } from '../common/sms/sms.service';

describe('InviteService request-mode approvals', () => {
  let service: InviteService;
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const roomRepo = { findOne: jest.fn() };
  const email = { sendRoomInviteEmail: jest.fn() };
  const sms = { sendRoomInviteSms: jest.fn() };

  const requestInvite = {
    id: 'inv-1',
    token: 'tok-1',
    productId: 'p1',
    roomId: 'r1',
    createdBy: 'seller-1',
    mode: InviteMode.REQUEST,
    response: InviteResponse.PENDING,
    usageCount: 0,
    maxUsage: 1,
    isActive: true,
    expiresAt: new Date(Date.now() + 3600000),
    isExpired: () => false,
  } as unknown as Invite;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: getRepositoryToken(Invite), useValue: repo },
        { provide: getRepositoryToken(Room), useValue: roomRepo },
        { provide: EmailService, useValue: email },
        { provide: SmsService, useValue: sms },
      ],
    }).compile();
    service = module.get<InviteService>(InviteService);
  });

  it('requestAccess records identity on a REQUEST-mode invite', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(requestInvite);
    (repo.save as jest.Mock).mockImplementation(async (i) => i);

    const result = await service.requestAccess('tok-1', {
      name: 'Jane',
      email: 'jane@x.com',
    });

    expect(result.inviteeName).toBe('Jane');
    expect(result.inviteeEmail).toBe('jane@x.com');
    // Requesting access does not consume usage
    expect(result.usageCount).toBe(0);
  });

  it('requestAccess rejects EXCLUSIVE-mode invites', async () => {
    const exclusive = { ...requestInvite, mode: InviteMode.EXCLUSIVE };
    (repo.findOne as jest.Mock).mockResolvedValue(exclusive);

    await expect(service.requestAccess('tok-1', {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('requestAccess rejects already-accepted invites', async () => {
    const accepted = {
      ...requestInvite,
      response: InviteResponse.ACCEPTED,
    };
    (repo.findOne as jest.Mock).mockResolvedValue(accepted);

    await expect(service.requestAccess('tok-1', {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('approve transitions a PENDING request to ACCEPTED (owner only)', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(requestInvite);
    (repo.save as jest.Mock).mockImplementation(async (i) => i);

    const result = await service.approve('inv-1', 'seller-1');

    expect(result.response).toBe(InviteResponse.ACCEPTED);
    expect(result.respondedAt).toBeInstanceOf(Date);
  });

  it('approve rejects a non-owner', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(requestInvite);

    await expect(service.approve('inv-1', 'other-user')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('approve rejects EXCLUSIVE-mode invites', async () => {
    const exclusive = { ...requestInvite, mode: InviteMode.EXCLUSIVE };
    (repo.findOne as jest.Mock).mockResolvedValue(exclusive);

    await expect(service.approve('inv-1', 'seller-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('reject transitions a request to DECLINED', async () => {
    // Fresh object — earlier tests mutate the shared requestInvite
    const fresh = { ...requestInvite, response: InviteResponse.PENDING };
    (repo.findOne as jest.Mock).mockResolvedValue(fresh);
    (repo.save as jest.Mock).mockImplementation(async (i) => i);

    const result = await service.reject('inv-1', 'seller-1');

    expect(result.response).toBe(InviteResponse.DECLINED);
  });

  it('reject refuses a request that was already handled', async () => {
    const accepted = {
      ...requestInvite,
      response: InviteResponse.ACCEPTED,
    };
    (repo.findOne as jest.Mock).mockResolvedValue(accepted);

    await expect(service.reject('inv-1', 'seller-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('pendingRequests lists PENDING request-mode invites for the seller', async () => {
    (repo.find as jest.Mock).mockResolvedValue([requestInvite]);

    const result = await service.pendingRequests('seller-1');

    expect(result).toHaveLength(1);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ createdBy: 'seller-1' }),
      }),
    );
  });

  it('throws NotFound for an unknown invite on approve', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.approve('nope', 'seller-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
