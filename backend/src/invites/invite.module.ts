import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './invite.entity';
import { User } from '../auth/entities/user.entity';
import { Room } from '../rooms/entities/room.entity';
import { Product } from '../products/entities/product.entity';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { EmailModule } from '../common/email/email.module';
import { SmsModule } from '../common/sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Invite, Room, Product]),
    EmailModule,
    SmsModule,
  ],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
