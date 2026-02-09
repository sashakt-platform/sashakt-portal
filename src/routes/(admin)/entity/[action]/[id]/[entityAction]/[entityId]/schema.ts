import { z } from 'zod';

const baseEntitySchema = z.object({
	name: z.string().min(1, { error: 'Entity name is required' }),
	description: z.string().optional().nullable(),
	active: z.boolean().default(true)
});

export const entitySchema = baseEntitySchema.extend({
	entity_type_id: z.coerce.number().min(1, { error: 'Entity type is required' }),
	state_id: z.coerce.number().optional().nullable(),
	district_id: z.coerce.number().optional().nullable(),
	block_id: z.coerce.number().optional().nullable()
});

export type EntityFormSchema = typeof entitySchema;
