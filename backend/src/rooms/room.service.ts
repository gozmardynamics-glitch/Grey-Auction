import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus, RoomParticipant, RoomType } from './entities/room.entity';
import { CreateRoomDto, JoinRoomDto } from './dto/room.dto';
import { USER_PUBLIC_SELECT } from '../common/projections/user-projection';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly repo: Repository<Room>,
    @InjectRepository(RoomParticipant)
    private readonly participantRepo: Repository<RoomParticipant>,
  ) {}

  async create(dto: CreateRoomDto, userId: string): Promise<Room> {
    const roomCode = `RM-${Date.now().toString(36).toUpperCase()}`;
    const room = this.repo.create({
      ...dto,
      roomCode,
      productIds: dto.auctionIds || [],
      createdById: userId,
      status: RoomStatus.SCHEDULED,
    });
    return this.repo.save(room);
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      // Public listing: hydrate ONLY display-safe creator fields (the full
      // User row would leak email/phone/address to anonymous visitors).
      relations: ['createdBy'],
      select: {
        createdBy: USER_PUBLIC_SELECT,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findBySeller(userId: string) {
    return this.repo.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

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

  async joinRoom(roomId: string, userId: string, dto: JoinRoomDto): Promise<RoomParticipant> {
    const room = await this.findById(roomId);

    if (room.type === RoomType.PRIVATE) {
      if (room.createdById !== userId && !room.invitedUserIds.includes(userId)) {
        if (room.allowInviteCode && dto.inviteCode) {
          if (dto.inviteCode !== room.inviteCode) {
            throw new ForbiddenException('Invalid invite code');
          }
        } else {
          throw new ForbiddenException('Private room requires an invite');
        }
      }
    }

    const existing = await this.participantRepo.findOne({
      where: { roomId, userId },
    });
    if (existing) return existing;

    const participant = this.participantRepo.create({
      roomId,
      userId,
      hasPaidDeposit: !room.requiresDeposit,
      isActive: true,
    });
    return this.participantRepo.save(participant);
  }

  async getParticipants(roomId: string): Promise<RoomParticipant[]> {
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
}
