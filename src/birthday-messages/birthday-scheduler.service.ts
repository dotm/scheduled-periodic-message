import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BirthdaySchedulerService {
  private readonly logger = new Logger(BirthdaySchedulerService.name);

  @Cron('0,15,30,45 * * * *')
  handleBirthdayMessages() {
    this.logger.log('Birthday message cron job started');
    // TODO: Implement birthday message sending logic
    this.logger.log('Birthday message cron job completed');
  }
}
