import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { CommonAIModule } from './ai/ai.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { StructuredLoggerService } from './logger/structured-logger.service';

@Module({
  imports: [StorageModule, EmailModule, CommonAIModule],
  providers: [StructuredLoggerService],
  exports: [StorageModule, EmailModule, CommonAIModule, StructuredLoggerService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
