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

export enum OmrMode {
	NEVER = 'NEVER',
	ALWAYS = 'ALWAYS',
	OPTIONAL = 'OPTIONAL'
}

export const testSchema = z.object({
	name: z.string(),
	description: z.string(),
	is_active: z.boolean().default(true),
	start_time: z.string().nullable().optional(),
	end_time: z.string().nullable().optional(),
	time_limit: z.number().nullable().optional(),
	marks_level: z.enum(Object.values(MarksLevel)).nullable().default(MarksLevel.QUESTION),
	marks: z.number().nullable().optional(),
	marking_scheme: marksSchema,
	completion_message: z.string().nullable().optional(),
	start_instructions: z.string().nullable().optional(),
	link: z.string().nullable().optional(),
	no_of_attempts: z.number().default(1),
	shuffle: z.boolean().default(false),
	random_questions: z.boolean().default(false),
	no_of_random_questions: z.number().nullable().optional(),
	random_tag_count: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
				count: z.number().int().min(0)
			})
		)
		.default([]),
	question_pagination: z.number().min(0).default(0),
	is_template: z.boolean().default(false),
	template_id: z.string().nullable().optional(),
	tag_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	question_revision_ids: z.array(z.number()).default([]),
	state_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	district_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	show_result: z.boolean().default(true),
	show_question_palette: z.boolean().default(true),
	candidate_profile: z.boolean().default(false),
	locale: z.string().default('en-US'),
	certificate_id: z.coerce.number().nullable(),
	show_feedback_on_completion: z.boolean().default(false),
	show_feedback_immediately: z.boolean().default(false),
	form_id: z.coerce.number().nullable().optional(),
	omr: z.enum(Object.values(OmrMode)).default(OmrMode.NEVER)
});

export type FormSchema = typeof testSchema;
