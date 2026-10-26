import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus, RoomParticipant, RoomType } from './entities/room.entity';
import { CreateRoomDto, JoinRoomDto } from './dto/room.dto';
import { USER_PUBLIC_SELECT } from '../common/projections/user-projection';
import { InviteService } from '../invites/invite.service';

/** A room as a given viewer is allowed to see it. */
export type PublicRoom = Partial<Room> & Pick<Room, 'id' | 'name' | 'type' | 'status'>;

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly repo: Repository<Room>,
    @InjectRepository(RoomParticipant)
    private readonly participantRepo: Repository<RoomParticipant>,
    private readonly inviteService: InviteService,
  ) {}

  async create(dto: CreateRoomDto, userId: string): Promise<Room> {
    const roomCode = `RM-${Date.now().toString(36).toUpperCase()}`;
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Room start and end times must be valid dates');
    }
    if (endTime <= startTime) {
      throw new BadRequestException('Room must end after it starts');
    }

    const room = this.repo.create({
      ...dto,
      startTime,
      endTime,
      roomCode,
      productIds: dto.auctionIds || [],
      createdById: userId,
      status: RoomStatus.SCHEDULED,
    });
    return this.repo.save(room);
  }

  /**
   * Public listing.
   *
   * Private rooms are invite-only, so they must not appear here: this endpoint
   * needs no credentials and used to enumerate every tenant's private sales,
   * complete with join codes.
   */
  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      where: { type: RoomType.PUBLIC },
      // Hydrate ONLY display-safe creator fields (the full User row would leak
      // email/phone/address to anonymous visitors).
      relations: ['createdBy'],
      select: {
        createdBy: USER_PUBLIC_SELECT,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: data.map((room) => this.sanitize(room)), total, page, limit };
  }

  /** The caller's own rooms — the only place a join code is returned. */
  async findBySeller(userId: string) {
    return this.repo.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /** Internal lookup: never returned to a client unsanitised. */
  async findById(id: string): Promise<Room> {
    const room = await this.repo.findOne({
      where: { id },
      // Same public-endpoint posture as findAll: creator gets a safe projection.
      relations: ['createdBy'],
      select: {
        createdBy: USER_PUBLIC_SELECT,
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  /**
   * A room for a viewer who may be anonymous.
   *
   * A public room is readable by anyone. A private one is readable only by its
   * owner and its participants — otherwise the access check in `joinRoom` is
   * decorative, since anyone holding the id could read the join code here.
   */
  async findForViewer(id: string, viewerId?: string): Promise<PublicRoom> {
    const room = await this.findById(id);

    if (room.type === RoomType.PRIVATE && !(await this.canEnter(room, viewerId))) {
      throw new ForbiddenException('This bidding room is private');
    }

    return this.sanitize(room, viewerId);
  }

  async joinRoom(
    roomId: string,
    user: { id: string; email?: string | null },
    dto: JoinRoomDto,
  ): Promise<RoomParticipant> {
    const room = await this.findById(roomId);

    if (room.type === RoomType.PRIVATE && !(await this.canEnter(room, user.id))) {
      // An invite token is the credential a private room hands out; a join code
      // is the weaker one the seller may also enable.
      if (dto.inviteToken) {
        await this.inviteService.redeemForRoom(dto.inviteToken, roomId, user);
        await this.admit(room, user.id);
      } else if (room.allowInviteCode && dto.inviteCode) {
        if (dto.inviteCode !== room.inviteCode) {
          throw new ForbiddenException('Invalid invite code');
        }
      } else {
        throw new ForbiddenException('Private room requires an invite');
      }
    }

    const existing = await this.participantRepo.findOne({
      where: { roomId, userId: user.id },
    });
    if (existing) return existing;

    const participant = this.participantRepo.create({
      roomId,
      userId: user.id,
      hasPaidDeposit: !room.requiresDeposit,
      isActive: true,
    });
    return this.participantRepo.save(participant);
  }

  async getParticipants(roomId: string, viewerId?: string): Promise<RoomParticipant[]> {
    const room = await this.findById(roomId);
    if (room.type === RoomType.PRIVATE && !(await this.canEnter(room, viewerId))) {
      throw new ForbiddenException('This bidding room is private');
    }

    // Member-facing: hydrate ONLY display-safe user fields (same posture as
    // the public bid feed) instead of the full User row.
    return this.participantRepo.find({
      where: { roomId },
      relations: ['user'],
      select: {
        user: USER_PUBLIC_SELECT,
      },
    });
  }

  async updateStatus(id: string, status: RoomStatus): Promise<void> {
    await this.repo.update(id, { status });
  }

  /** Owner, invited bidder, or joined participant. */
  private async canEnter(room: Room, userId?: string): Promise<boolean> {
    if (!userId) return false;
    if (room.createdById === userId) return true;
    if (room.invitedUserIds?.includes(userId)) return true;

    const participant = await this.participantRepo.findOne({
      where: { roomId: room.id, userId },
    });
    return !!participant;
  }

  /** Record a redeemed invitation on the room so later visits need no token. */
  private async admit(room: Room, userId: string): Promise<void> {
    const invited = room.invitedUserIds ?? [];
    if (invited.includes(userId)) return;
    await this.repo.update(room.id, { invitedUserIds: [...invited, userId] });
  }

  /** Strip the secrets nobody but the owner may read. */
  private sanitize(room: Room, viewerId?: string): PublicRoom {
    if (viewerId && room.createdById === viewerId) return room;
    const { inviteCode, invitedUserIds, ...rest } = room;
    void inviteCode;
    void invitedUserIds;
    return rest;
  }
}
