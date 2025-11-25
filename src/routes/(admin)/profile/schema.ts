import { z } from 'zod';

// Base schema for common fields
export const editUserSchema = z.object({
	full_name: z.string().min(1, { error: 'Full name is required' }),
	email: z.email({ error: 'Invalid email address' }),
	phone: z.string().optional()
});

export type EditUserSchema = typeof editUserSchema;
