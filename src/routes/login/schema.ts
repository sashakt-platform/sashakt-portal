import { z } from 'zod';
import { PASSWORD_MIN } from '$lib/constants';

export const loginSchema = z.object({
	username: z.email({ error: 'Invalid email address' }),
	password: z
		.string()
		.min(PASSWORD_MIN, { error: `Password must be at least ${PASSWORD_MIN} characters.` })
});

export type FormSchema = typeof loginSchema;

export const resetSchema = z.object({
	email: z.string().email('Enter a valid email')
});
export type ResetFormSchema = typeof resetSchema;
