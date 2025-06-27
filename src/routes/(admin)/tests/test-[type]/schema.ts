import { z } from 'zod';


export const testSchema = z.object({
	test_id: z.number().int().optional(),
	name: z.string(),
	description: z.string(),
	start_time: z.string().nullable().optional(),
	end_time: z.string().nullable().optional(),
	time_limit: z.number().nullable().optional(),
	marks_level: z.enum(['question', 'test']).nullable().optional(),
	marks: z.number().nullable().optional(),
	completion_message: z.string().nullable().optional(),
	start_instructions: z.string().nullable().optional(),
	link: z.string().nullable().optional(),
	no_of_attempts: z.number().optional().default(1),
	shuffle: z.boolean().optional().default(false),
	random_questions: z.boolean().optional().default(false),
	no_of_random_questions: z.number().nullable().optional(),
	question_pagination: z.number().optional().default(1),
	is_template: z.boolean().optional().default(false),
	template_id: z.number().nullable().optional(),
	tag_ids: z.array(z.string()).default([]),
	question_revision_ids: z.array(z.number()).default([]),
	state_ids: z.array(z.string()).default([])
});

export const individualTestSchema = z.object({
	test_id: z.number().int(),
});

export type FormSchema = typeof testSchema;

export type IndividualTestSchema = typeof individualTestSchema;


