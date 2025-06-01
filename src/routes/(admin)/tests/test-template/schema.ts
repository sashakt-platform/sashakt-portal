import { z } from 'zod';


/*
export const loginSchema = z.object({
	username: z.string().email({ message: 'Invalid email address' }),
	password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});
*/
export const testTemplateSchema = z.object({
	name: z.string(),
	description: z.string(),
	start_time: z.string().optional(),
	end_time: z.string().optional(),
	time_limit: z.number().optional(),
	marks_level: z.enum(['question', 'test']).optional(),
	marks: z.number().optional(),
	completion_message: z.string().optional(),
	start_instructions: z.string().optional(),
	link: z.string().url().optional(),
	no_of_attempts: z.number().optional(),
	shuffle: z.boolean().optional(),
	random_questions: z.boolean().optional(),
	no_of_random_questions: z.number().optional(),
	question_pagination: z.number().optional(),
	is_template: z.boolean().optional(),
	template_id: z.number().optional(),
	created_by_id: z.number(),
	tag_ids: z.array(z.string()).default([]),
	question_revision_ids: z.array(z.string()).default([]),
	state_ids: z.array(z.string()).default([])
});

export type FormSchema = typeof testTemplateSchema;


/*

	let testData = $state({
		name: '',
		description: '',
		start_time: '',
		end_time: '',
		time_limit: 1,
		marks_level: 'question',
		marks: 0,
		completion_message: '',
		start_instructions: '',
		link: '',
		no_of_attempts: 1,
		shuffle: false,
		random_questions: false,
		no_of_random_questions: 0,
		question_pagination: 1,
		is_template: false,
		template_id: 0,
		created_by_id: 0,
		tags: [],
		question_revision_ids: [],
		states: []
	});

    */
