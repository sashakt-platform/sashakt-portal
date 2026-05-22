import { z } from 'zod';

export const organisationSchema = z.object({
	name: z.string().min(1, { error: 'Organisation name is required' }),
	shortcode: z
		.string()
		.min(1, { error: 'Shortcode is required' })
		.regex(/^[a-z0-9-]+$/, { error: 'Only lowercase letters, numbers, and hyphens allowed' }),
	description: z.string().optional().nullable(),
	is_active: z.boolean().default(true),
	logo: z.string().optional().nullable()
});

export type OrganisationSchema = typeof organisationSchema;
