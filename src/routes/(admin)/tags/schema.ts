import { z } from 'zod';

export const tagSchema = z.object({
	description: z.string().nullable().optional(),
	name: z.string().min(1, { error: 'Tag name is required' }),
	tag_type_id: z.number().nullable().default(null).optional()
});

export type TagFormSchema = typeof tagSchema;

export const tagTypeSchema = z.object({
	name: z.string().min(1, { error: 'Tag type name is required' }),
	description: z.string().nullable().optional(),
	organization_id: z.number()
});

export type TagTypeFormSchema = typeof tagTypeSchema;
