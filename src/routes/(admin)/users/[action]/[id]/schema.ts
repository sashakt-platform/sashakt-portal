import { z } from 'zod';

export const userSchema = z
	.object({
		full_name: z.string().min(1, { message: 'Full name is required' }),
		email: z.string().email({ message: 'Invalid email address' }),
		password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
		confirm_password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
		phone: z.string().optional(),
		organization_id: z.number(),
		role_id: z.number(),
		is_active: z.boolean().optional().default(true)
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'Passwords must match',
		path: ['confirm_password']
	});

export type FormSchema = typeof userSchema;
