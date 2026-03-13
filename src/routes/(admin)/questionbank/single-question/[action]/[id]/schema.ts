import { z } from 'zod';
import { marksSchema } from '$lib/schemas/marks';

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

export enum QuestionTypeEnum {
	SingleChoice = 'single-choice',
	MultiChoice = 'multi-choice',
	Subjective = 'subjective',
	NumericalInteger = 'numerical-integer',
	NumericalDecimal = 'numerical-decimal',
	MatrixMatch = 'matrix-match'
}

export const questionSchema = z.object({
	question_text: z.string().min(1, { error: 'Question text is required' }),
	instructions: z.string().nullable().optional(),
	question_type: z.enum(QuestionTypeEnum).default(QuestionTypeEnum.SingleChoice),
	options: z.union([z.array(optionSchema), matrixMatchOptionsSchema]).default([]),
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
	is_active: z.boolean().default(true)
});

export type FormSchema = typeof questionSchema;

export const tagSchema = z.object({
	description: z.string().nullable().optional(),
	name: z.string().min(1, { error: 'Tag name is required' }),
	tag_type_id: z.number().nullable().default(null).optional()
});

export type TagFormSchema = typeof tagSchema;
