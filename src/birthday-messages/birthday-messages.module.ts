import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirthdayMessagesService } from './birthday-messages.service';
import { BirthdayMessageHistory } from './birthday-message-history.entity';
import { BirthdaySchedulerService } from './birthday-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([BirthdayMessageHistory])],
  providers: [BirthdayMessagesService, BirthdaySchedulerService],
  exports: [BirthdayMessagesService],
})
export class BirthdayMessagesModule {}
