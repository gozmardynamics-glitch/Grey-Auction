import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './banner.entity';

@Injectable()
export class BannerService {
  constructor(@InjectRepository(Banner) private readonly repo: Repository<Banner>) {}

  findAll() { return this.repo.find({ order: { position: 'ASC' } }); }
  findById(id: string) { return this.repo.findOne({ where: { id } }); }
  create(dto: Partial<Banner>) { return this.repo.save(this.repo.create(dto)); }
  async update(id: string, dto: Partial<Banner>) { await this.repo.update(id, dto); return this.findById(id); }
  async remove(id: string) { await this.repo.delete(id); }
}
