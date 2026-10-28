import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { ContactController } from './contact.controller';
import { TicketSlaService } from './ticket-sla.service';
import { TicketSlaCron } from './ticket-sla.cron';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), EmailModule],
  controllers: [TicketController, ContactController],
  providers: [TicketService, TicketSlaService, TicketSlaCron],
  exports: [TicketService],
})
export class TicketModule {}
