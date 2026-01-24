import { z } from 'zod';

// Base schema for organization fields
export const editOrganizationSchema = z.object({
	name: z.string().min(1, { message: 'Organization name is required' }),
	shortcode: z.string().min(1, { message: 'Shortcode is required' }),
	logo: z
		.union([
			z
				.instanceof(File, { message: 'Please upload a valid image file' })
				.refine((file) => file.size === 0 || file.type.startsWith('image/'), {
					message: 'File must be an image'
				})
				.refine((file) => file.size === 0 || file.size <= 2 * 1024 * 1024, {
					message: 'Image must be less than 2MB'
				}),
			z.string()
		])
		.optional()
});

export type EditOrganizationSchema = typeof editOrganizationSchema;
