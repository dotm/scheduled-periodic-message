import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { BirthdaySchedulerService } from '../src/birthday-messages/birthday-scheduler.service';
import { BirthdayMessageHistory } from '../src/birthday-messages/birthday-message-history.entity';
import { MessageStatus } from '../src/birthday-messages/message-status.enum';
import { User } from '../src/users/user.entity';

describe('BirthdaySchedulerService (testcontainers)', () => {
  jest.setTimeout(60000);

  let container: StartedPostgreSqlContainer;
  let moduleRef: TestingModule;
  let scheduler: BirthdaySchedulerService;
  let userRepo: Repository<User>;
  let historyRepo: Repository<BirthdayMessageHistory>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getMappedPort(5432),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [User, BirthdayMessageHistory],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, BirthdayMessageHistory]),
      ],
      providers: [BirthdaySchedulerService],
    }).compile();

    scheduler = moduleRef.get(BirthdaySchedulerService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    historyRepo = moduleRef.get(getRepositoryToken(BirthdayMessageHistory));
  });

  afterAll(async () => {
    await moduleRef?.close();
    await container?.stop();
  });

  beforeEach(async () => {
    await historyRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
  });

  it('queues today birthdays when it is 9 AM in the user local time zone', async () => {
    const now = new Date();

    // Scheduler runs ~3 minutes early
    const effectiveNow = new Date(now.getTime() + 3 * 60 * 1000);

    // Force *local* time to be 08:57 (so 3 minutes later it is 09:00)
    const targetLocal = new Date(
      effectiveNow.getUTCFullYear(),
      effectiveNow.getUTCMonth(),
      effectiveNow.getUTCDate(),
      8, 57, 0, 0,
    );

    // tzOffset in HOURS
    const tzOffset =
      (targetLocal.getTime() - effectiveNow.getTime()) / (1000 * 60 * 60);

    const user = await userRepo.save({
      firstName: 'Alice',
      lastName: 'Doe',
      email: 'alice@example.com',
      birthDate: new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
        )
      ),
      tzOffset,
    });

    await scheduler.queueTodayBirthdays();

    const histories = await historyRepo.find();
    expect(histories).toHaveLength(1);
    expect(histories[0].userId).toBe(user.id);
    expect(histories[0].status).toBe(MessageStatus.QUEUED);
  });

  it('queues recovery birthdays that were missed while the service was down', async () => {
    const now = new Date();
    const threeDaysAgo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3),
    );

    const user = await userRepo.save({
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      birthDate: threeDaysAgo,
      tzOffset: 0,
    });

    await scheduler.queueRecoveryBirthdays();

    const histories = await historyRepo.find();
    expect(histories).toHaveLength(1);
    expect(histories[0].userId).toBe(user.id);
    expect(histories[0].status).toBe(MessageStatus.QUEUED);
  });
});
