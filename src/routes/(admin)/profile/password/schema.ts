import { PASSWORD_MIN } from '$lib/constants';
import { z } from 'zod';

export const passwordSchema = z
	.object({
		current_password: z.string().min(1, 'Current password is required'),
		new_password: z
			.string()
			.min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`),
		confirm_password: z.string().min(1, 'Confirm password is required')
	})
	.refine(
		(data) => {
			// confirm_password is required and must match
			if (data.new_password && data.new_password.length > 0) {
				return data.confirm_password === data.new_password;
			}
			return true;
		},
		{ error: 'Passwords must match', path: ['confirm_password'] }
	);
