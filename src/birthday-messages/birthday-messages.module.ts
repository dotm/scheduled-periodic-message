import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirthdayMessagesService } from './birthday-messages.service';
import { BirthdayMessageHistory } from './birthday-message-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BirthdayMessageHistory])],
  providers: [BirthdayMessagesService],
  exports: [BirthdayMessagesService],
})
export class BirthdayMessagesModule {}
