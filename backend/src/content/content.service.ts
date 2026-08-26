import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentPage } from './content.entity';

@Injectable()
export class ContentService {
  constructor(@InjectRepository(ContentPage) private readonly repo: Repository<ContentPage>) {}

  findBySlug(slug: string) { return this.repo.findOne({ where: { slug } }); }
  findAll() { return this.repo.find({ take: 50 }); }

  async upsert(slug: string, dto: Partial<ContentPage>) {
    const existing = await this.repo.findOne({ where: { slug } });
    if (existing) {
      await this.repo.update(existing.id, dto);
      return this.repo.findOne({ where: { id: existing.id } });
    }
    return this.repo.save(this.repo.create({ ...dto, slug }));
  }
}
