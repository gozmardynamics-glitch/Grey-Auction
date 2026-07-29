import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { CommonAIModule } from './ai/ai.module';

@Module({
  imports: [StorageModule, EmailModule, CommonAIModule],
  exports: [StorageModule, EmailModule, CommonAIModule],
})
export class CommonModule {}
