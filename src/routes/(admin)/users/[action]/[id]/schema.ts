import { z } from 'zod';
import { PASSWORD_MIN } from '$lib/constants';

// Base schema for common fields
const baseUserSchema = z.object({
	full_name: z.string().min(1, { message: 'Full name is required' }),
	email: z.string().email({ message: 'Invalid email address' }),
	phone: z.string().optional(),
	organization_id: z.number({ message: 'Organization is required' }),
	role_id: z.number({ message: 'Role is required' }),
	is_active: z.boolean().optional().default(true)
});

// Schema for creating new user (passwords required)
export const createUserSchema = baseUserSchema
	.extend({
		password: z
			.string()
			.min(PASSWORD_MIN, { message: `Password must be at least ${PASSWORD_MIN} characters.` }),
		confirm_password: z
			.string()
			.min(PASSWORD_MIN, { message: `Password must be at least ${PASSWORD_MIN} characters.` })
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'Passwords must match',
		path: ['confirm_password']
	});

// Schema for editing user (passwords optional, but if provided must match)
export const editUserSchema = baseUserSchema
	.extend({
		password: z.string().optional(),
		confirm_password: z.string().optional()
	})
	.refine(
		(data) => {
			// If password is provided, it must meet minimum length
			if (data.password && data.password.length > 0) {
				return data.password.length >= PASSWORD_MIN;
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
			// If password is provided, confirm_password is required and must match
			if (data.password && data.password.length > 0) {
				return data.confirm_password === data.password;
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
			// If password is provided, confirm_password must not be empty
			if (data.password && data.password.length > 0) {
				return data.confirm_password && data.confirm_password.length > 0;
			}
			return true;
		},
		{
			message: 'Confirm password is required when password is provided',
			path: ['confirm_password']
		}
	);

// Default export for backward compatibility (create mode)
export const userSchema = createUserSchema;

export type CreateUserSchema = typeof createUserSchema;
export type EditUserSchema = typeof editUserSchema;
export type FormSchema = typeof userSchema;
