import { z } from 'zod';
import { PASSWORD_MIN } from '$lib/constants';

export const loginSchema = z.object({
	username: z.string().email({ message: 'Invalid email address' }),
	password: z
		.string()
		.min(PASSWORD_MIN, { message: `Password must be at least ${PASSWORD_MIN} characters.` })
});

export type FormSchema = typeof loginSchema;

export const resetSchema = z.object({
	email: z.string().email('Enter a valid email')
});
export type ResetFormSchema = typeof resetSchema;
