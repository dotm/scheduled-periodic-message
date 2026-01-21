import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class CreateUserRequestDto {
  @ApiProperty({ example: 'John', minLength: 1 })
  firstName: string;

  @ApiProperty({ example: 'Doe', minLength: 1 })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: '1990-05-15', description: 'ISO date string' })
  birthdayDate: string;

  @ApiProperty({ example: 'America/New_York', description: 'IANA time zone' })
  location: string;
}

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email address').min(1, 'Email is required'),
  birthdayDate: z.string().min(1, 'Birthday date is required'),
  location: z.string().min(1, 'Time zone identifier is required'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
