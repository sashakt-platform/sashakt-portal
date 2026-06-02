import { z } from 'zod';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const organisationSchema = z.object({
	name: z.string().min(1, { error: 'Organisation name is required' }),
	shortcode: z
		.string()
		.min(1, { error: 'Shortcode is required' })
		.regex(/^[a-z0-9-]+$/, { error: 'Only lowercase letters, numbers, and hyphens allowed' }),
	description: z.string().optional().nullable(),
	is_active: z.boolean().default(true),
	logo: z
		.instanceof(File, { message: 'Please upload a valid image file' })
		.refine((file) => file.size === 0 || ALLOWED_IMAGE_TYPES.includes(file.type), {
			message: 'File must be a PNG, JPG, or WebP image'
		})
		.refine((file) => file.size === 0 || file.size <= 2 * 1024 * 1024, {
			message: 'Image must be less than 2MB'
		})
		.nullish()
});

export type OrganisationSchema = typeof organisationSchema;
