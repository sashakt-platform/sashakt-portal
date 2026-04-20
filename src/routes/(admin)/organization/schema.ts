import { z } from 'zod';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// Base schema for organization fields
export const editOrganizationSchema = z.object({
	name: z.string().min(1, { message: 'Organization name is required' }),
	shortcode: z
		.string()
		.min(1, { message: 'Shortcode is required' })
		.regex(/^[a-z0-9]+$/, {
			message: 'Shortcode must contain only lowercase letters and numbers, with no spaces or special characters'
		}),
	logo: z
		.union([
			z
				.instanceof(File, { message: 'Please upload a valid image file' })
				.refine((file) => file.size === 0 || ALLOWED_IMAGE_TYPES.includes(file.type), {
					message: 'File must be a PNG, JPG, or WebP image'
				})
				.refine((file) => file.size === 0 || file.size <= 2 * 1024 * 1024, {
					message: 'Image must be less than 2MB'
				}),
			z.string()
		])
		.nullish()
});

export type EditOrganizationSchema = typeof editOrganizationSchema;
