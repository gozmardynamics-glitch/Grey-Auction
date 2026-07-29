import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
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
  ],
})
export class AppModule {}
