import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [StorageModule, EmailModule],
  exports: [StorageModule, EmailModule],
})
export class CommonModule {}
