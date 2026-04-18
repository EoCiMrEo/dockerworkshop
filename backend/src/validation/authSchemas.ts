import { z } from 'zod';

export const credentialsSchema = z.object({
  username: z
    .string({ required_error: 'username is required' })
    .min(3, 'username must be at least 3 characters')
    .max(32, 'username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'username can include letters, numbers, and underscore only'),
  password: z
    .string({ required_error: 'password is required' })
    .min(8, 'password must be at least 8 characters')
    .max(128, 'password must be at most 128 characters')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required')
});
