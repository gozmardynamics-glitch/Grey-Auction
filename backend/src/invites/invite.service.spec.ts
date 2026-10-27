import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InviteService } from './invite.service';
import { Invite, InviteMode, InviteResponse } from './invite.entity';
import { Room } from '../rooms/entities/room.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
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
  const roomRepo = { findOne: jest.fn(), find: jest.fn() };
  const userRepo = { findOne: jest.fn(), find: jest.fn() };
  const productRepo = { find: jest.fn() };
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
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
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

  describe('request-mode invites are the seller\u2019s decision', () => {
    it('refuses to let the holder accept a request-mode invite themselves', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({
        ...requestInvite,
        response: InviteResponse.PENDING,
      });

      await expect(service.respond('tok-1', 'accepted')).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('still lets the holder decline', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({
        ...requestInvite,
        response: InviteResponse.PENDING,
      });
      (repo.save as jest.Mock).mockImplementation(async (i) => i);

      const result = await service.respond('tok-1', 'declined');

      expect(result.response).toBe(InviteResponse.DECLINED);
    });

    it('does not admit a bidder through a request-mode token before approval', async () => {
      const pending = {
        ...requestInvite,
        response: InviteResponse.PENDING,
        roomId: 'r1',
        inviteeEmail: 'buyer@example.com',
      };
      // validate() and the redeem lookup both hit repo.findOne.
      (repo.findOne as jest.Mock).mockResolvedValue(pending);

      await expect(
        service.redeemForRoom('tok-1', 'r1', {
          id: 'buyer-1',
          email: 'buyer@example.com',
        }),
      ).rejects.toThrow(/not approved/);
    });

    it('admits the invitee once the seller has approved', async () => {
      const approved = {
        ...requestInvite,
        response: InviteResponse.ACCEPTED,
        roomId: 'r1',
        inviteeEmail: 'buyer@example.com',
      };
      (repo.findOne as jest.Mock).mockResolvedValue(approved);

      const result = await service.redeemForRoom('tok-1', 'r1', {
        id: 'buyer-1',
        email: 'buyer@example.com',
      });

      expect(result).toBe(approved);
    });

    it('refuses a token that was issued to a different address', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({
        ...requestInvite,
        response: InviteResponse.ACCEPTED,
        roomId: 'r1',
        inviteeEmail: 'invited@example.com',
      });

      await expect(
        service.redeemForRoom('tok-1', 'r1', {
          id: 'stranger',
          email: 'stranger@example.com',
        }),
      ).rejects.toThrow(/another account/);
    });

    it('refuses a token issued for a different room', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({
        ...requestInvite,
        response: InviteResponse.ACCEPTED,
        roomId: 'r1',
      });

      await expect(
        service.redeemForRoom('tok-1', 'r2', { id: 'buyer-1', email: 'a@b.com' }),
      ).rejects.toThrow(/different room/);
    });
  });

  describe('invite listings are owner-scoped', () => {
    it('filters by the creator so a token is never handed to a stranger', () => {
      (repo.find as jest.Mock).mockResolvedValue([]);

      void service.findByRoom('r1', { id: 'seller-1', role: 'seller' });

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { roomId: 'r1', createdBy: 'seller-1' } }),
      );
    });

    it('lets an admin read every invite for oversight', () => {
      (repo.find as jest.Mock).mockResolvedValue([]);

      void service.findByProduct('p1', { id: 'admin-1', role: 'admin' });

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: 'p1' } }),
      );
    });

    it('refuses a listing with no viewer instead of returning every row', async () => {
      // These routes were public: an anonymous caller could enumerate invite
      // tokens for any room and then redeem one.
      await expect(service.findByRoom('r1', undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.find).not.toHaveBeenCalled();
    });
  });
});
