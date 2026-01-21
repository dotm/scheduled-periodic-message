import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  birthdayDate: z.string().min(1, 'Birthday date is required'),
  timeZoneIdentifier: z.string().min(1, 'Time zone identifier is required'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
