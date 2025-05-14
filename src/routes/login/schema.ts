import { z } from 'zod';

export const loginSchema = z.object({
	username: z.string().email({ message: 'Invalid email address' }).default('admin@example.com'),
	password: z.string().min(6, { message: 'Password must be at least 6 characters' }).default('admin1234'),
});

export type FormSchema = typeof loginSchema;
