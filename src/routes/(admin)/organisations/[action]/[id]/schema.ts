import { z } from 'zod';
import { imageFileSchema } from '$lib/schemas/logo';

export const organisationSchema = z.object({
	name: z.string().min(1, { error: 'Organisation name is required' }),
	shortcode: z
		.string()
		.min(1, { error: 'Shortcode is required' })
		.max(50, { error: 'Shortcode must be 50 characters or fewer' })
		.regex(/^[a-z0-9-]+$/, { error: 'Only lowercase letters, numbers, and hyphens allowed' }),
	description: z.string().optional().nullable(),
	is_active: z.boolean().default(true),
	logo: imageFileSchema.nullish()
});

export type OrganisationSchema = typeof organisationSchema;
