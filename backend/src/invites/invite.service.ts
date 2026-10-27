import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Invite, InviteExpiry, InviteMode, InviteResponse } from './invite.entity';
import { GenerateInviteDto } from './dto/invite.dto';
import { EmailService } from '../common/email/email.service';
import { SmsService } from '../common/sms/sms.service';
import { Room } from '../rooms/entities/room.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';

/** What a recipient sees about an invitation they were sent. */
export interface InviteDetail {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  usageCount: number;
  maxUsage: number;
  mode: InviteMode;
  response: InviteResponse;
  isActive: boolean;
  room: {
    id: string;
    name: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    type: string;
    status: string;
    requiresDeposit: boolean;
    depositAmount: number | null;
  } | null;
  product: { id: string; title: string; currentBid: number; imageUrl?: string } | null;
  inviter: { id: string; name: string } | null;
}

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Invite)
    private readonly repo: Repository<Invite>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async generate(userId: string, dto: GenerateInviteDto): Promise<Invite> {
    const token = randomBytes(32).toString('hex');
    const expiry = dto.expiry || InviteExpiry.TWENTY_FOUR_HOURS;
    const expiresAt = this.calculateExpiry(expiry);
    const mode: InviteMode = dto.mode === 'request' ? InviteMode.REQUEST : InviteMode.EXCLUSIVE;

    const invite = this.repo.create({
      token,
      productId: dto.productId,
      roomId: dto.roomId,
      createdBy: userId,
      expiry,
      expiresAt,
      maxUsage: dto.maxUsage || (mode === InviteMode.REQUEST ? 1 : 10),
      mode,
      inviteeEmail: dto.inviteeEmail ?? null,
      inviteeName: dto.inviteeName ?? null,
    } as Invite);

    const saved: Invite = await this.repo.save(invite);

    // Send email notification if email provided
    if (dto.inviteeEmail) {
      await this.sendInviteEmail(saved, dto);
    }

    // Send SMS notification if phone provided
    if (dto.inviteePhone) {
      await this.sendInviteSms(saved, dto);
    }

    return saved;
  }

  private async sendInviteEmail(invite: Invite, dto: GenerateInviteDto): Promise<void> {
    try {
      const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${frontendUrl}/invite/${invite.token}`;

      await this.emailService.sendRoomInviteEmail(dto.inviteeEmail!, {
        inviterName: 'A GreyAuction Seller',
        roomName: room?.name || 'Auction Room',
        inviteLink,
        startTime: room?.startTime || new Date(),
        expiresAt: invite.expiresAt,
        isPrivate: room?.type === 'private',
      });
      this.logger.log(`Invite email sent to ${dto.inviteeEmail}`);
    } catch (error) {
      this.logger.warn(`Failed to send invite email: ${error.message}`);
    }
  }

  private async sendInviteSms(invite: Invite, dto: GenerateInviteDto): Promise<void> {
    try {
      const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${frontendUrl}/invite/${invite.token}`;

      await this.smsService.sendRoomInviteSms(dto.inviteePhone!, {
        roomName: room?.name || 'Auction Room',
        inviteLink,
      });
    } catch (error) {
      this.logger.warn(`Failed to send invite SMS: ${error.message}`);
    }
  }

  async validate(token: string): Promise<Invite> {
    const invite = await this.repo.findOne({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.isExpired()) throw new BadRequestException('Invite has expired or reached usage limit');
    return invite;
  }

  async useInvite(token: string): Promise<Invite> {
    const invite = await this.validate(token);
    invite.usageCount += 1;
    return this.repo.save(invite);
  }

  /** Enriched view of a single invitation, for the invite landing page. */
  async landing(token: string): Promise<InviteDetail> {
    const invite = await this.validate(token);
    const [detail] = await this.describe([invite]);
    return detail;
  }

  /**
   * Check an invitation token can be exchanged for room access, and return it.
   *
   * The token is the credential — it is delivered to one address — so possession
   * alone is enough for an exclusive invite. When the invite names an invitee,
   * the redeeming account must match it: otherwise forwarding the email grants a
   * stranger entry to a private sale. Request-mode invites only hand out access
   * once the seller has approved them.
   */
  async redeemForRoom(
    token: string,
    roomId: string,
    user: { id: string; email?: string | null },
  ): Promise<Invite> {
    const invite = await this.validate(token);

    if (invite.roomId !== roomId) {
      throw new BadRequestException('This invitation is for a different room');
    }

    if (
      invite.inviteeEmail &&
      user.email &&
      invite.inviteeEmail.toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new ForbiddenException('This invitation was issued to another account');
    }

    if (invite.mode === InviteMode.REQUEST && invite.response !== InviteResponse.ACCEPTED) {
      throw new ForbiddenException(
        'The seller has not approved this request yet',
      );
    }

    if (invite.mode === InviteMode.EXCLUSIVE && invite.response === InviteResponse.PENDING) {
      invite.response = InviteResponse.ACCEPTED;
      invite.respondedAt = new Date();
      invite.usageCount += 1;
      return this.repo.save(invite);
    }

    if (invite.response === InviteResponse.DECLINED) {
      throw new ForbiddenException('This invitation was declined');
    }

    return invite;
  }

  /**
   * Room, product and inviter for a set of invites, in three queries rather than
   * one per row. Read-only: an invite list must not fail because a room was
   * deleted underneath it.
   */
  private async describe(invites: Invite[]): Promise<InviteDetail[]> {
    if (invites.length === 0) return [];

    const roomIds = [...new Set(invites.map((invite) => invite.roomId).filter(Boolean))];
    const productIds = [...new Set(invites.map((invite) => invite.productId).filter(Boolean))];
    const inviterIds = [...new Set(invites.map((invite) => invite.createdBy).filter(Boolean))];

    const [rooms, products, inviters] = await Promise.all([
      roomIds.length
        ? this.roomRepo.find({ where: { id: In(roomIds) } })
        : Promise.resolve([]),
      productIds.length
        ? this.productRepo.find({
            where: { id: In(productIds) },
            select: ['id', 'title', 'currentBid', 'images'],
          })
        : Promise.resolve([]),
      inviterIds.length
        ? this.userRepo.find({
            where: { id: In(inviterIds) },
            select: ['id', 'name'],
          })
        : Promise.resolve([]),
    ]);

    const roomById = new Map(rooms.map((room) => [room.id, room]));
    const productById = new Map(products.map((product) => [product.id, product]));
    const inviterById = new Map(inviters.map((user) => [user.id, user]));

    return invites.map((invite) => {
      const room = roomById.get(invite.roomId) ?? null;
      const product = productById.get(invite.productId) ?? null;
      const inviter = inviterById.get(invite.createdBy) ?? null;

      return {
        token: invite.token,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        usageCount: invite.usageCount,
        maxUsage: invite.maxUsage,
        mode: invite.mode,
        response: invite.response,
        isActive: invite.isActive,
        room: room
          ? {
              id: room.id,
              name: room.name,
              description: room.description ?? null,
              startTime: room.startTime,
              endTime: room.endTime,
              type: room.type,
              status: room.status,
              requiresDeposit: room.requiresDeposit,
              depositAmount: room.depositAmount ?? null,
            }
          : null,
        product: product
          ? {
              id: product.id,
              title: product.title,
              currentBid: Number(product.currentBid) || 0,
              imageUrl: product.images?.[0],
            }
          : null,
        inviter: inviter ? { id: inviter.id, name: inviter.name } : null,
      };
    });
  }

  async respond(token: string, response: 'accepted' | 'declined'): Promise<Invite> {
    const invite = await this.repo.findOne({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.isExpired()) throw new BadRequestException('Invite has expired');

    // A request-mode invite is a request FOR access: the seller decides. Letting
    // the holder mark it accepted here would let anyone with the link approve
    // themselves past the seller, which is the whole point of the mode.
    if (invite.mode === InviteMode.REQUEST && response === 'accepted') {
      throw new BadRequestException(
        'The seller must approve a request-mode invitation',
      );
    }

    invite.response =
      response === 'accepted' ? InviteResponse.ACCEPTED : InviteResponse.DECLINED;
    invite.respondedAt = new Date();
    return this.repo.save(invite);
  }

  /**
   * REQUEST-mode invite: the invitee requests access to the room. Records
   * their identity and leaves the invite PENDING for the seller to approve.
   */
  async requestAccess(
    token: string,
    identity?: { name?: string; email?: string },
  ): Promise<Invite> {
    const invite = await this.validate(token);
    if (invite.mode !== InviteMode.REQUEST) {
      throw new BadRequestException(
        'This invite does not require approval — use it directly.',
      );
    }
    if (invite.response === InviteResponse.ACCEPTED) {
      throw new BadRequestException('Access already granted for this invite');
    }
    if (invite.response === InviteResponse.DECLINED) {
      throw new BadRequestException('This invite request was declined');
    }

    if (identity?.name) invite.inviteeName = identity.name;
    if (identity?.email) invite.inviteeEmail = identity.email;
    // The request itself does not consume usage — the seller's approval does.
    return this.repo.save(invite);
  }

  /** Seller approves a REQUEST-mode invite (only the invite creator). */
  async approve(id: string, userId: string): Promise<Invite> {
    const invite = await this.repo.findOne({ where: { id } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.createdBy !== userId) {
      throw new BadRequestException('Only the invite owner can approve');
    }
    if (invite.mode !== InviteMode.REQUEST) {
      throw new BadRequestException('Only request-mode invites need approval');
    }
    if (new Date() > invite.expiresAt || !invite.isActive) {
      throw new BadRequestException('Invite has expired');
    }

    invite.response = InviteResponse.ACCEPTED;
    invite.respondedAt = new Date();
    return this.repo.save(invite);
  }

  /** Seller rejects a REQUEST-mode invite. */
  async reject(id: string, userId: string): Promise<Invite> {
    const invite = await this.repo.findOne({ where: { id } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.createdBy !== userId) {
      throw new BadRequestException('Only the invite owner can reject');
    }
    if (invite.mode !== InviteMode.REQUEST) {
      throw new BadRequestException('Only request-mode invites need approval');
    }
    if (invite.response !== InviteResponse.PENDING) {
      throw new BadRequestException('This request was already handled');
    }

    invite.response = InviteResponse.DECLINED;
    invite.respondedAt = new Date();
    return this.repo.save(invite);
  }

  /**
   * Invitations addressed to this account holder.
   *
   * `pendingRequests` below returns invitations the caller *sent*; nothing
   * exposed the ones they *received*, so a buyer only ever saw them in an email.
   * Matched on the account email, still pending and not expired.
   */
  async received(userId: string): Promise<InviteDetail[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email'],
    });
    if (!user?.email) return [];

    const invites = await this.repo
      .createQueryBuilder('invite')
      .where('LOWER(invite.inviteeEmail) = LOWER(:email)', { email: user.email })
      .andWhere('invite.response = :pending', { pending: InviteResponse.PENDING })
      .andWhere('invite.expiresAt > :now', { now: new Date() })
      .orderBy('invite.expiresAt', 'ASC')
      .take(50)
      .getMany();

    return this.describe(invites);
  }

  /** Pending request-mode invites created by this seller. */
  async pendingRequests(userId: string): Promise<Invite[]> {
    return this.repo.find({
      where: {
        createdBy: userId,
        mode: InviteMode.REQUEST,
        response: InviteResponse.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByProduct(
    productId: string,
    viewer?: { id: string; role?: string },
  ): Promise<Invite[]> {
    return this.repo.find({
      where: { productId, ...this.ownerScope(viewer) },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findByRoom(
    roomId: string,
    viewer?: { id: string; role?: string },
  ): Promise<Invite[]> {
    return this.repo.find({
      where: { roomId, ...this.ownerScope(viewer) },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Row filter for invite listings: an invitation row carries the token, so it
   * is a credential. Only its creator may read it; admins may read all.
   */
  private ownerScope(viewer?: { id: string; role?: string }): { createdBy?: string } {
    if (!viewer?.id) {
      throw new BadRequestException('Sign in to list invitations');
    }
    return viewer.role === 'admin' ? {} : { createdBy: viewer.id };
  }

  async deactivate(id: string, userId: string): Promise<void> {
    const invite = await this.repo.findOne({ where: { id } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.createdBy !== userId) throw new BadRequestException('Not your invite');
    invite.isActive = false;
    await this.repo.save(invite);
  }

  private calculateExpiry(expiry: InviteExpiry): Date {
    const now = new Date();
    switch (expiry) {
      case InviteExpiry.ONE_HOUR:
        return new Date(now.getTime() + 60 * 60 * 1000);
      case InviteExpiry.SEVEN_DAYS:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case InviteExpiry.NEVER:
        return new Date('2099-12-31');
      case InviteExpiry.TWENTY_FOUR_HOURS:
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}
