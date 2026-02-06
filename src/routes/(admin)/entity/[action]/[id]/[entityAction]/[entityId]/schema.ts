import { z } from 'zod';

const baseEntitySchema = z.object({
	name: z.string().min(1, { error: 'Entity name is required' }),
	description: z.string().optional().nullable(),
	entity_type_id: z.coerce.number().min(1, { error: 'Entity type is required' }),
	state_id: z.coerce.number().optional().nullable(),
	district_id: z.coerce.number().optional().nullable(),
	block_id: z.coerce.number().optional().nullable()
});

export const createEntitySchema = baseEntitySchema;

export const editEntitySchema = baseEntitySchema;

export const entitySchema = createEntitySchema;

export type CreateEntitySchema = typeof createEntitySchema;
export type EditEntitySchema = typeof editEntitySchema;
export type EntityFormSchema = typeof entitySchema;
