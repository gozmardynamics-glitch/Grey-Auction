import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './faq.entity';

@Injectable()
export class FaqService {
  constructor(@InjectRepository(Faq) private readonly repo: Repository<Faq>) {}

  findAll() { return this.repo.find({ order: { category: 'ASC', order: 'ASC' } }); }
  findById(id: string) { return this.repo.findOne({ where: { id } }); }
  create(dto: Partial<Faq>) { return this.repo.save(this.repo.create(dto)); }
  async update(id: string, dto: Partial<Faq>) { await this.repo.update(id, dto); return this.findById(id); }
  async remove(id: string) { await this.repo.delete(id); }
}
