import { z } from 'zod';

const baseEntitySchema = z.object({
	name: z.string().min(1, { error: 'Entity name is required' }),
	description: z.string().optional().nullable(),
	active: z.boolean().default(true)
});

export const createEntitySchema = baseEntitySchema.extend({
	entity_type_id: z.coerce.number().min(1, { error: 'Entity type is required' }),
	state_id: z.coerce.number().optional().nullable(),
	district_id: z.coerce.number().optional().nullable(),
	block_id: z.coerce.number().optional().nullable()
});

export const editEntitySchema = baseEntitySchema.extend({
	entity_type_id: z.coerce.number().min(1, { error: 'Entity type is required' }),
	entity_type: z
		.object({
			id: z.coerce.number().min(1, { error: 'Entity type ID is required' }),
			name: z.string().optional()
		})
		.optional()
		.nullable(),
	state: z
		.object({
			id: z.number().optional(),
			name: z.string().optional()
		})
		.optional()
		.nullable(),
	district: z
		.object({
			id: z.number().optional(),
			name: z.string().optional()
		})
		.optional()
		.nullable(),
	block: z
		.object({
			id: z.number().optional(),
			name: z.string().optional()
		})
		.optional()
		.nullable()
});

export const entitySchema = createEntitySchema;

export type CreateEntitySchema = typeof createEntitySchema;
export type EditEntitySchema = typeof editEntitySchema;
export type EntityFormSchema = typeof entitySchema;
