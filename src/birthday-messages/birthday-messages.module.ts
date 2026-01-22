import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirthdayMessagesService } from './birthday-messages.service';
import { BirthdayMessageHistory } from './birthday-message-history.entity';
import { BirthdaySchedulerService } from './birthday-scheduler.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BirthdayMessageHistory, User])],
  providers: [BirthdayMessagesService, BirthdaySchedulerService],
  exports: [BirthdayMessagesService],
})
export class BirthdayMessagesModule {}
