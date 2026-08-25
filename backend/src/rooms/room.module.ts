import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room, RoomParticipant } from './entities/room.entity';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RoomLifecycleService } from './room-lifecycle.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomParticipant])],
  controllers: [RoomController],
  providers: [RoomService, RoomLifecycleService],
  exports: [RoomService],
})
export class RoomModule {}
