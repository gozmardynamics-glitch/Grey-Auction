import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { CommonAIModule } from './ai/ai.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

@Module({
  imports: [StorageModule.forRoot(), EmailModule, CommonAIModule],
  exports: [StorageModule, EmailModule, CommonAIModule],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
