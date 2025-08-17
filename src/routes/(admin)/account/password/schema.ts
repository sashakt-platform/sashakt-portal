import { PASSWORD_MIN } from '$lib/constants';
import { z } from 'zod';

export const passwordSchema = z
	.object({
		current_password: z.string(),
		new_password: z.string(),
		confirm_password: z.string()
	})
	.refine(
		(data) => {
			// new password must meet minimum length
			if (data.new_password && data.new_password.length > 0) {
				return data.new_password.length >= PASSWORD_MIN;
			}
			return true;
		},
		{
			message: `Password must be at least ${PASSWORD_MIN} characters.`,
			path: ['password']
		}
	)
	.refine(
		(data) => {
			// confirm_password is required and must match
			if (data.new_password && data.new_password.length > 0) {
				return data.confirm_password === data.new_password;
			}
			return true;
		},
		{
			message: 'Passwords must match',
			path: ['confirm_password']
		}
	)
	.refine(
		(data) => {
			// confirm_password must not be empty
			if (data.new_password && data.new_password.length > 0) {
				return data.confirm_password && data.confirm_password.length > 0;
			}
			return true;
		},
		{
			message: 'Confirm password is required when password is provided',
			path: ['confirm_password']
		}
	);
