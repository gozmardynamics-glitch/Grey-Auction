import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room, RoomParticipant } from './entities/room.entity';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RoomLifecycleService } from './room-lifecycle.service';
import { BidModule } from '../bids/bid.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomParticipant]),
    BidModule,
    NotificationModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomLifecycleService],
  exports: [RoomService],
})
export class RoomModule {}
