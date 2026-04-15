import { PASSWORD_MIN } from '$lib/constants';
import { z } from 'zod';

export const profileSchema = z
	.object({
		full_name: z.string().min(1, { error: 'Full name is required' }),
		email: z.email({ error: 'Invalid email address' }),
		phone: z.string().optional(),
		role_label: z.string().optional(),
		organization_name: z.string().optional(),
		current_password: z.string().optional(),
		new_password: z.string().optional(),
		confirm_password: z.string().optional()
	})
	.refine(
		(data) => {
			if (data.new_password || data.confirm_password) {
				return !!data.current_password && data.current_password.length > 0;
			}
			return true;
		},
		{ error: 'Current password is required to change password', path: ['current_password'] }
	)
	.refine(
		(data) => {
			if (data.new_password && data.new_password.length > 0) {
				return data.new_password.length >= PASSWORD_MIN;
			}
			return true;
		},
		{ error: `Password must be at least ${PASSWORD_MIN} characters.`, path: ['new_password'] }
	)
	.refine(
		(data) => {
			if (data.new_password && data.new_password.length > 0) {
				return data.confirm_password === data.new_password;
			}
			return true;
		},
		{ error: 'Passwords must match', path: ['confirm_password'] }
	);

export type ProfileSchema = typeof profileSchema;
