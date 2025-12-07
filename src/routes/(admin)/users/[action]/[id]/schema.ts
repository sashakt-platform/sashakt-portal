import { z } from 'zod';
import { PASSWORD_MIN } from '$lib/constants';

// Base schema for common fields
const baseUserSchema = z.object({
	full_name: z.string().min(1, { error: 'Full name is required' }),
	email: z.email({ error: 'Invalid email address' }),
	phone: z.string().optional(),
	organization_id: z.coerce.number().min(1, { error: 'Organization is required' }),
	role_id: z.coerce.number().min(1, { error: 'Role is required' }),
	state_ids: z.array(z.coerce.number()).default([]),
	is_active: z.boolean().default(true)
});

// Schema for creating new user (passwords required)
export const createUserSchema = baseUserSchema
	.extend({
		password: z
			.string()
			.min(PASSWORD_MIN, { error: `Password must be at least ${PASSWORD_MIN} characters.` }),
		confirm_password: z
			.string()
			.min(PASSWORD_MIN, { error: `Password must be at least ${PASSWORD_MIN} characters.` })
	})
	.refine((data) => data.password === data.confirm_password, {
		error: 'Passwords must match',
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
		{ error: `Password must be at least ${PASSWORD_MIN} characters.`, path: ['password'] }
	)
	.refine(
		(data) => {
			// If password is provided, confirm_password is required and must match
			if (data.password && data.password.length > 0) {
				return data.confirm_password === data.password;
			}
			return true;
		},
		{ error: 'Passwords must match', path: ['confirm_password'] }
	)
	.refine(
		(data) => {
			// If password is provided, confirm_password must not be empty
			if (data.password && data.password.length > 0) {
				return data.confirm_password && data.confirm_password.length > 0;
			}
			return true;
		},
		{ error: 'Confirm password is required when password is provided', path: ['confirm_password'] }
	);

// Default export for backward compatibility (create mode)
export const userSchema = createUserSchema;

export type CreateUserSchema = typeof createUserSchema;
export type EditUserSchema = typeof editUserSchema;
export type FormSchema = typeof userSchema;
