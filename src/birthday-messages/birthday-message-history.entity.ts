import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { MessageStatus } from './message-status.enum';

@Entity('birthday_message_history')
export class BirthdayMessageHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'birthday_date', type: 'date' })
  birthdayDate: Date;

  @Column({ name: 'message_sent_at', type: 'timestamp', nullable: true })
  messageSentAt: Date | null;

  @Column({
    type: 'varchar',
    default: MessageStatus.QUEUED,
  })
  status: MessageStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
