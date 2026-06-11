import { z } from 'zod';
import { marksSchema } from '$lib/schemas/marks';

import { QuestionTypeEnum } from '$lib/types/question';

export const optionSchema = z.object({
	id: z.number().int(),
	key: z.string(),
	value: z.string()
});

export const matrixColumnSchema = z.object({
	label: z.string(),
	items: z.array(optionSchema).default([])
});
export const matrixMatchOptionsSchema = z.object({
	rows: matrixColumnSchema,
	columns: matrixColumnSchema
});

export const matrixInputOptionsSchema = z.object({
	rows: matrixColumnSchema,
	columns: z.object({
		label: z.string(),
		input_type: z.enum(['text', 'number'])
	})
});

export const questionSchema = z.object({
	question_text: z.string().min(1, { message: 'Question text is required' }),
	instructions: z.string().nullable().optional(),
	question_type: z.enum(QuestionTypeEnum).default(QuestionTypeEnum.SingleChoice),
	options: z
		.union([z.array(optionSchema), matrixInputOptionsSchema, matrixMatchOptionsSchema])
		.default([]),
	correct_answer: z
		.union([z.array(z.number()), z.number(), z.record(z.string(), z.array(z.number()))])
		.default([]),
	subjective_answer_limit: z.coerce.number().int().positive().nullable().optional(),
	is_mandatory: z.boolean().default(false),
	marking_scheme: marksSchema,
	solution: z.string().nullable().optional(),
	organization_id: z.number().int().positive(),
	state_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	district_ids: z.array(z.string()).default([]),
	block_ids: z.array(z.string()).default([]),
	tag_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	tag_type_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	is_active: z.boolean().default(true)
});

export type FormSchema = typeof questionSchema;
