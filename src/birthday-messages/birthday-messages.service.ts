import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BirthdayMessageHistory } from './birthday-message-history.entity';
import { MessageStatus } from './message-status.enum';

@Injectable()
export class BirthdayMessagesService {
  constructor(
    @InjectRepository(BirthdayMessageHistory)
    private birthdayMessageRepository: Repository<BirthdayMessageHistory>,
  ) {}

  findAll(): Promise<BirthdayMessageHistory[]> {
    return this.birthdayMessageRepository.find({ relations: ['user'] });
  }

  findByUserId(userId: number): Promise<BirthdayMessageHistory[]> {
    return this.birthdayMessageRepository.find({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(
    userId: number,
    birthdayDate: Date,
  ): Promise<BirthdayMessageHistory> {
    const message = this.birthdayMessageRepository.create({
      userId,
      birthdayDate,
      status: MessageStatus.QUEUED,
      messageSentAt: null,
    });
    return this.birthdayMessageRepository.save(message);
  }

  async updateStatus(
    id: number,
    status: MessageStatus,
    messageSentAt?: Date,
  ): Promise<void> {
    await this.birthdayMessageRepository.update(id, {
      status,
      ...(status === MessageStatus.SUCCESSFUL &&
        messageSentAt && { messageSentAt }),
    });
  }
}
