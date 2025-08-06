import { z } from 'zod';

export const tagSchema = z.object({
	description: z.string().nullable().optional(),
	name: z.string().nonempty({ message: 'Tag name is required' }),
	tag_type_id: z.number().nullable().default(null).optional()
});

export type TagFormSchema = typeof tagSchema;

export const tagTypeSchema = z.object({
	name: z.string().nonempty({ message: 'Tag type name is required' }),
	description: z.string().nullable().optional(),
	organization_id: z.number()
});

export type TagTypeFormSchema = typeof tagTypeSchema;
