import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Invite, InviteExpiry } from './invite.entity';
import { GenerateInviteDto } from './dto/invite.dto';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Invite)
    private readonly repo: Repository<Invite>,
  ) {}

  async generate(userId: string, dto: GenerateInviteDto): Promise<Invite> {
    const token = randomBytes(32).toString('hex');
    const expiry = dto.expiry || InviteExpiry.TWENTY_FOUR_HOURS;
    const expiresAt = this.calculateExpiry(expiry);

    const invite = this.repo.create({
      token,
      productId: dto.productId,
      roomId: dto.roomId,
      createdBy: userId,
      expiry,
      expiresAt,
      maxUsage: dto.maxUsage || 10,
    });

    return this.repo.save(invite);
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

  async findByProduct(productId: string): Promise<Invite[]> {
    return this.repo.find({ where: { productId }, order: { createdAt: 'DESC' } });
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
