import { z } from 'zod';

const baseRoleSchema = z.object({
	label: z.string().min(1, { error: 'Display label is required' }),
	description: z.string().optional().nullable(),
	is_active: z.boolean().default(true),
	location_scope: z.enum(['state', 'district']).nullable().default(null),
	allowed_roles: z.array(z.string()).default([]),
	permissions: z.array(z.number()).default([]),
	visible_to_roles: z.array(z.string()).default([])
});

export const createRoleSchema = baseRoleSchema;

export const editRoleSchema = baseRoleSchema;

export const roleSchema = createRoleSchema;

export type CreateRoleSchema = typeof createRoleSchema;
export type EditRoleSchema = typeof editRoleSchema;
export type RoleFormSchema = typeof roleSchema;
