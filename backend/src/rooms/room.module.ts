import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room, RoomParticipant } from './entities/room.entity';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RoomLifecycleService } from './room-lifecycle.service';
import { BidModule } from '../bids/bid.module';
import { NotificationModule } from '../notification/notification.module';
import { InviteModule } from '../invites/invite.module';
import { User } from '../auth/entities/user.entity';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomParticipant, User]),
    BidModule,
    NotificationModule,
    InviteModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomLifecycleService, OptionalJwtAuthGuard],
  exports: [RoomService],
})
export class RoomModule {}
