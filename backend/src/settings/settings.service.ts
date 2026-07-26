import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

class Setting {
  key: string;
  value: any;
}

// In-memory fallback when DB is not available
const memoryStore: Record<string, any> = {};

@Injectable()
export class SettingsService {
  // Uses a simple key-value approach. Can be backed by a Setting entity later.
  private useMemory = true;

  async get(key: string): Promise<any> {
    if (this.useMemory) return memoryStore[key] || {};
    return {};
  }

  async set(key: string, value: any): Promise<void> {
    memoryStore[key] = value;
  }

  async getAll(): Promise<Record<string, any>> {
    return { ...memoryStore };
  }
}
