import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Invite, InviteExpiry, InviteMode, InviteResponse } from './invite.entity';
import { GenerateInviteDto } from './dto/invite.dto';
import { EmailService } from '../common/email/email.service';
import { SmsService } from '../common/sms/sms.service';
import { Room } from '../rooms/entities/room.entity';

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(
    @InjectRepository(Invite)
    private readonly repo: Repository<Invite>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
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

  async respond(token: string, response: 'accepted' | 'declined'): Promise<Invite> {
    const invite = await this.repo.findOne({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.isExpired()) throw new BadRequestException('Invite has expired');

    invite.response =
      response === 'accepted' ? InviteResponse.ACCEPTED : InviteResponse.DECLINED;
    invite.respondedAt = new Date();
    return this.repo.save(invite);
  }

  async findByProduct(productId: string): Promise<Invite[]> {
    return this.repo.find({ where: { productId }, order: { createdAt: 'DESC' } });
  }

  async findByRoom(roomId: string): Promise<Invite[]> {
    return this.repo.find({ where: { roomId }, order: { createdAt: 'DESC' } });
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
