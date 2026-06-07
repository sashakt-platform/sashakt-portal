import { z } from 'zod';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Shared image-upload schema for organisation logos.
 *
 * Treats a zero-byte File as "no upload" so callers can mark the field
 * `.nullish()` and still validate when the form was submitted without
 * picking a new file (file inputs always submit at least an empty File).
 */
export const imageFileSchema = z
	.instanceof(File, { error: 'Please upload a valid image file' })
	.refine((file) => file.size === 0 || ALLOWED_IMAGE_TYPES.includes(file.type), {
		error: 'File must be a PNG, JPG, or WebP image'
	})
	.refine((file) => file.size === 0 || file.size <= MAX_IMAGE_BYTES, {
		error: 'Image must be less than 2MB'
	});
