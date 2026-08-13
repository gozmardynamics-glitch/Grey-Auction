import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './invite.entity';
import { Room } from '../rooms/entities/room.entity';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { EmailModule } from '../common/email/email.module';
import { SmsModule } from '../common/sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Invite, Room]), EmailModule, SmsModule],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
