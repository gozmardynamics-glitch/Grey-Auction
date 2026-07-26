import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';

@Injectable()
export class TicketService {
  constructor(@InjectRepository(Ticket) private readonly repo: Repository<Ticket>) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  findById(id: string) { return this.repo.findOne({ where: { id } }); }

  async create(dto: Partial<Ticket>) {
    return this.repo.save(this.repo.create({ ...dto, messages: [] }));
  }

  async sendMessage(id: string, senderId: string, content: string) {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) return null;
    const messages = (ticket.messages || []) as any[];
    messages.push({ senderId, content, timestamp: new Date().toISOString() });
    await this.repo.update(id, { messages });
    return this.repo.findOne({ where: { id } });
  }
}
