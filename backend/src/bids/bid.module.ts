import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bid } from './entities/bid.entity';
import { BidService } from './bid.service';
import { BidController } from './bid.controller';
import { AuctionGateway } from './gateways/auction.gateway';
import { ProductModule } from '../products/product.module';
import { NotificationModule } from '../notification/notification.module';
import { WalletModule } from '../wallet/wallet.module';
import { Seller } from '../seller/entities/seller.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, Seller]),
    ProductModule,
    NotificationModule,
    WalletModule,
  ],
  controllers: [BidController],
  providers: [BidService, AuctionGateway],
  exports: [BidService, AuctionGateway],
})
export class BidModule {}
