import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sendBirthdayEmail } from 'src/helpers/email-helpers';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { BirthdayMessageHistory } from './birthday-message-history.entity';
import { MessageStatus } from './message-status.enum';
import th from 'zod/v4/locales/th.js';

@Injectable()
export class BirthdaySchedulerService {
  private readonly logger = new Logger(BirthdaySchedulerService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(BirthdayMessageHistory)
    private readonly birthdayMessageHistoryRepository: Repository<BirthdayMessageHistory>,
  ) {}

  @Cron('57,12,27,42 * * * *')
  async queueTodayBirthdays() {
    //TODO: inject now (current time) with new Date() as default value for automatic testing
    this.logger.log(
      `Queuing today's birthdays at ${new Date().toISOString()}`,
    );

    const users = await this.userRepository
      .createQueryBuilder('u')
      .where( //birthday is today in user's local time zone
        `
        MAKE_DATE(
          EXTRACT(YEAR FROM NOW() AT TIME ZONE 'UTC')::int,
          EXTRACT(MONTH FROM u.birth_date)::int,
          EXTRACT(DAY FROM u.birth_date)::int
        ) = CURRENT_DATE
      `,
      )
      .andWhere( //time is 08:57-08:59 in user's local time zone
        `
        EXTRACT(HOUR FROM (
          NOW() AT TIME ZONE 'UTC'
          + (u.tz_offset || ' hours')::interval
        )) = 8
        AND
        EXTRACT(MINUTE FROM (
          NOW() AT TIME ZONE 'UTC'
          + (u.tz_offset || ' hours')::interval
        )) BETWEEN 56 AND 59
      `,
      )
      .andWhere( //has not been queued
        `
        NOT EXISTS (
          SELECT 1
          FROM birthday_message_history h
          WHERE
            h.user_id = u.id
            AND h.birthday_date = CURRENT_DATE
        )
      `,
      )
      .getMany();

    await Promise.all(
      users.map((u) =>
        this.birthdayMessageHistoryRepository.save({
          userId: u.id,
          birthdayDate: new Date(),
          status: MessageStatus.QUEUED,
        }),
      ),
    );

    this.logger.log(
      `Done queuing today's birthdays at ${new Date().toISOString()}`,
    );
  }

  @Cron('57,12,27,42 * * * *')
  async queueRecoveryBirthdays() {
    //TODO: inject now (current time) with new Date() as default value for automatic testing
    this.logger.log(
      `Queuing recovery birthdays at ${new Date().toISOString()}`,
    );

    const supportedRecoveryDays = 5;
    const qb = await this.userRepository
      .createQueryBuilder('u')
      .where( //birthday was within supportedRecoveryDays
        `
      MAKE_DATE(
        EXTRACT(YEAR FROM NOW() AT TIME ZONE 'UTC')::int,
        EXTRACT(MONTH FROM u.birth_date)::int,
        EXTRACT(DAY FROM u.birth_date)::int
      )
      BETWEEN CURRENT_DATE - INTERVAL '${supportedRecoveryDays} days'
      AND CURRENT_DATE - INTERVAL '1 day'
    `, //TODO: send even within the same day but before 9 AM
      )
      .andWhere( //has not been queued
        `
      NOT EXISTS (
        SELECT 1
        FROM birthday_message_history h
        WHERE
          h.user_id = u.id
          AND h.birthday_date =
            MAKE_DATE(
              EXTRACT(YEAR FROM NOW() AT TIME ZONE 'UTC')::int,
              EXTRACT(MONTH FROM u.birth_date)::int,
              EXTRACT(DAY FROM u.birth_date)::int
            )
      )
    `,
      );
    //for debugging:
    // const [sql, params] = qb.getQueryAndParameters();
    // console.log('SQL:\n', sql);
    // console.log('Params:\n', params);
    const users = await qb.getMany();

    const now = new Date();
    await Promise.all(
      users.map((u) => {
        const birthDate = new Date(`${u.birthDate}T00:00:00Z`);
        const birthdayDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          birthDate.getUTCMonth(),
          birthDate.getUTCDate(),
        ));
    
        this.birthdayMessageHistoryRepository.save({
          userId: u.id,
          birthdayDate,
          status: MessageStatus.QUEUED,
        });
      }),
    );

    this.logger.log(
      `Done queuing recovery birthdays at ${new Date().toISOString()}`,
    );
  }

  @Cron('57,12,27,42 * * * *')
  async requeueFailedBirthdayMessages() {
    this.logger.log(
      `Requeuing failed birthday messages at ${new Date().toISOString()}`,
    );

    const failedMessages = await this.birthdayMessageHistoryRepository.find({
      where: {
        status: MessageStatus.FAILED,
      },
    });
    //TODO: handle when status is IN_PROGRESS for too long

    await Promise.all(
      failedMessages.map((message) =>
        this.birthdayMessageHistoryRepository.update(message.id, {
          status: MessageStatus.QUEUED,
        }),
      ),
    );

    this.logger.log(
      `Done requeuing failed birthday messages at ${new Date().toISOString()}`,
    );
  }

  @Cron('0,15,30,45 * * * *')
  async handleSendBirthdayMessages() {
    const queuedBirthdayMessages =
      await this.birthdayMessageHistoryRepository.find({
        where: {
          status: MessageStatus.QUEUED,
        },
        relations: ['user'],
      });

    this.logger.log(
      `Processing ${queuedBirthdayMessages.length} queued birthday messages`,
    );
    await Promise.all(
      queuedBirthdayMessages.map(async (message) => {
        const user = message.user;
        await this.birthdayMessageHistoryRepository.update(message.id, {
          status: MessageStatus.IN_PROGRESS,
        });

        let messageSentAt: Date | null = new Date();
        let status = MessageStatus.SUCCESSFUL;

        try {
          await sendBirthdayEmail(user.email, user.firstName, user.lastName);
        } catch (err) {
          this.logger.error(
            `Failed to send birthday email to user ${user.id}`,
            err,
          );
          messageSentAt = null;
          status = MessageStatus.FAILED;
        }

        await this.birthdayMessageHistoryRepository.update(message.id, {
          messageSentAt,
          status,
        });
      }),
    );
  }
}
