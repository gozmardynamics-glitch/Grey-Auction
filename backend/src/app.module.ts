import { Module, OnApplicationShutdown } from '@nestjs/common';
import { TypeOrmModule, InjectDataSource } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './config/database.config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { ProductModule } from './products/product.module';
import { RoomModule } from './rooms/room.module';
import { BidModule } from './bids/bid.module';
import { CategoryModule } from './categories/category.module';
import { BannerModule } from './banners/banner.module';
import { FaqModule } from './faqs/faq.module';
import { TicketModule } from './tickets/ticket.module';
import { SettingsModule } from './settings/settings.module';
import { ContentModule } from './content/content.module';
import { AIModule } from './ai/ai.module';
import { AgentsModule } from './agents/agents.module';
import { InviteModule } from './invites/invite.module';
import { AuditModule } from './audit/audit.module';
import { FeeModule } from './fees/fee.module';
import { PaymentModule } from './payments/payment.module';
import { InvoiceModule } from './invoices/invoice.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationModule } from './notification/notification.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TrustModule } from './trust/trust.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    CommonModule,
    AuthModule,
    AdminModule,
    SellerModule,
    ProductModule,
    RoomModule,
    BidModule,
    CategoryModule,
    BannerModule,
    FaqModule,
    TicketModule,
    SettingsModule,
    ContentModule,
    AIModule,
    AgentsModule,
    InviteModule,
    AuditModule,
    FeeModule,
    InvoiceModule,
    PaymentModule,
    WalletModule,
    NotificationModule,
    SubscriptionModule,
    TrustModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnApplicationShutdown {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationShutdown(signal?: string) {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
