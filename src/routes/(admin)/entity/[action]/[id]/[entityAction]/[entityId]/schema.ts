import { z } from 'zod';

const nullableNumberField = z.preprocess(
	(val) => (val === '' || val === undefined ? null : val),
	z.coerce.number().nullable().optional()
);

export const entitySchema = z.object({
	name: z.string().min(1, { error: 'Record name is required' }),
	description: z.string().optional().nullable(),
	active: z.boolean().default(true),
	entity_type_id: z.coerce.number().min(1, { error: 'Entity type is required' }),
	state_id: nullableNumberField,
	district_id: nullableNumberField,
	block_id: nullableNumberField
});

export type EntityFormSchema = typeof entitySchema;
