import { z } from 'zod';

export const marksSchema = z.object({
	correct: z.number().int().default(1),
	wrong: z.number().int().default(0),
	skipped: z.number().int().default(0)
});

export enum MarksLevel {
	QUESTION = 'question',
	TEST = 'test'
}

export const testSchema = z.object({
	name: z.string(),
	description: z.string(),
	start_time: z.string().nullable().optional(),
	end_time: z.string().nullable().optional(),
	time_limit: z.number().nullable().optional(),
	marks_level: z.nativeEnum(MarksLevel).nullable().optional().default(MarksLevel.QUESTION),
	marks: z.number().nullable().optional(),
	marking_scheme: marksSchema,
	completion_message: z.string().nullable().optional(),
	start_instructions: z.string().nullable().optional(),
	link: z.string().nullable().optional(),
	no_of_attempts: z.number().optional().default(1),
	shuffle: z.boolean().optional().default(false),
	random_questions: z.boolean().optional().default(false),
	no_of_random_questions: z.number().nullable().optional(),
	question_pagination: z.number().min(0).optional().default(0),
	is_template: z.boolean().optional().default(false),
	template_id: z.string().nullable().optional(),
	tag_ids: z.array(z.string()).default([]),
	question_revision_ids: z.array(z.number()).default([]),
	state_ids: z.array(z.string()).default([]),
	show_result: z.boolean().optional().default(true)
});

export type FormSchema = typeof testSchema;
