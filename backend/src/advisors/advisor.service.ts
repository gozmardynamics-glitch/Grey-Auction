import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advisor, AdvisorType } from './entities/advisor.entity';

@Injectable()
export class AdvisorService {
  constructor(
    @InjectRepository(Advisor)
    private readonly advisors: Repository<Advisor>,
  ) {}

  async list(filters: { country?: string; region?: string; type?: AdvisorType }): Promise<Advisor[]> {
    const where: any = { isActive: true };
    if (filters.country) where.country = filters.country;
    if (filters.region) where.region = filters.region;
    if (filters.type) where.type = filters.type;
    return this.advisors.find({ where, order: { country: 'ASC', region: 'ASC', name: 'ASC' }, take: 200 });
  }

  async get(id: string): Promise<Advisor> {
    const advisor = await this.advisors.findOne({ where: { id } });
    if (!advisor) throw new NotFoundException('Advisor not found');
    return advisor;
  }
}
