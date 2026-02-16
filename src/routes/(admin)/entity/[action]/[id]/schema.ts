import { z } from 'zod';

const baseEntitySchema = z.object({
	name: z.string().min(1, { error: 'Entity name is required' }),
	description: z.string().optional().nullable()
});

export const createEntitySchema = baseEntitySchema;

export const editEntitySchema = baseEntitySchema;

export const entitySchema = createEntitySchema;

export type CreateEntitySchema = typeof createEntitySchema;
export type EditEntitySchema = typeof editEntitySchema;
export type EntityFormSchema = typeof entitySchema;
