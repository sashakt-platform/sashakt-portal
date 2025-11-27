import { z } from 'zod';
import { PASSWORD_MIN } from '$lib/constants';

export const updatePasswordSchema = z
	.object({
		password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`),
		confirm_password: z.string(),
		token: z.string().min(1, 'Invalid or missing token')
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'Passwords must match',
		path: ['confirm_password']
	});

export type UpdatePasswordSchema = typeof updatePasswordSchema;
