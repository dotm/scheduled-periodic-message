import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BirthdayMessagesModule } from '../birthday-messages/birthday-messages.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), BirthdayMessagesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
