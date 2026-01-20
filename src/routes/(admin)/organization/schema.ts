import { z } from 'zod';

// Base schema for organization fields
export const editOrganizationSchema = z.object({
	name: z.string().min(1, { message: 'Organization name is required' }),
	description: z.string().optional(),
	shortcode: z.string().min(1, { message: 'Shortcode is required' }),
	logo: z.string().nullable().optional()
});

export type EditOrganizationSchema = typeof editOrganizationSchema;
