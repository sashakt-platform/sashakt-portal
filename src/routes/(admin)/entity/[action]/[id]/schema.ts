import { z } from 'zod';

const baseEntityTypeSchema = z.object({
	name: z.string().min(1, { error: 'Entity type name is required' }),
	description: z.string().optional().nullable()
});

export const createEntityTypeSchema = baseEntityTypeSchema;

export const editEntityTypeSchema = baseEntityTypeSchema;

export const entityTypeSchema = createEntityTypeSchema;

export type CreateEntityTypeSchema = typeof createEntityTypeSchema;
export type EditEntityTypeSchema = typeof editEntityTypeSchema;
export type EntityTypeFormSchema = typeof entityTypeSchema;
