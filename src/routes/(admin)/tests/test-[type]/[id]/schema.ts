import { z } from 'zod';
import { marksSchema } from '$lib/schemas/marks';

export enum MarksLevel {
	QUESTION = 'question',
	TEST = 'test'
}

export enum OmrMode {
	NEVER = 'NEVER',
	ALWAYS = 'ALWAYS',
	OPTIONAL = 'OPTIONAL'
}

const questionPreviewSchema = z
	.object({
		id: z.number(),
		question_text: z.string().default(''),
		is_mandatory: z.boolean().default(false),
		tags: z.array(z.object({ name: z.string() })).default([])
	})
	.passthrough();

export const questionSetSchema = z
	.object({
		id: z.number().nullable().optional(),
		title: z.string(),
		description: z.string().nullable().optional(),
		max_questions_allowed_to_attempt: z.number().int().min(1),
		display_order: z.number().int().min(1),
		marking_scheme: marksSchema.nullable().optional(),
		question_revision_ids: z.array(z.number()).default([]),
		question_revisions: z.array(questionPreviewSchema).default([])
	})
	.passthrough()
	.superRefine((questionSet, ctx) => {
		const mandatoryQuestionCount = getMandatoryQuestionCount(questionSet);
		if (mandatoryQuestionCount > questionSet.max_questions_allowed_to_attempt) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['max_questions_allowed_to_attempt'],
				message: `Question set '${questionSet.title}' has ${mandatoryQuestionCount} mandatory question(s), but only ${questionSet.max_questions_allowed_to_attempt} question(s) can be attempted.`
			});
		}
	});

type QuestionSetForMandatoryLimit = {
	title: string;
	max_questions_allowed_to_attempt: number;
	question_revisions?: Array<{ is_mandatory?: boolean }>;
};

export function getMandatoryQuestionCount(questionSet: QuestionSetForMandatoryLimit) {
	return (questionSet.question_revisions ?? []).filter((question) => question.is_mandatory).length;
}

export function getQuestionSetMandatoryLimitError(
	questionSets: QuestionSetForMandatoryLimit[] = []
) {
	for (const questionSet of questionSets) {
		const mandatoryQuestionCount = getMandatoryQuestionCount(questionSet);
		if (mandatoryQuestionCount > questionSet.max_questions_allowed_to_attempt) {
			return `Question set '${questionSet.title}' has ${mandatoryQuestionCount} mandatory question(s), but only ${questionSet.max_questions_allowed_to_attempt} question(s) can be attempted.`;
		}
	}

	return null;
}

export const testSchema = z.object({
	name: z.string(),
	description: z.string(),
	is_active: z.boolean().default(true),
	start_time: z.string().nullable().optional(),
	end_time: z.string().nullable().optional(),
	pause_timer_when_inactive: z.boolean().default(false),
	time_limit: z.number().nullable().optional(),
	marks_level: z.enum(Object.values(MarksLevel)).nullable().default(MarksLevel.QUESTION),
	marks: z.number().nullable().optional(),
	marking_scheme: marksSchema,
	completion_message: z.string().nullable().optional(),
	start_instructions: z.string().nullable().optional(),
	link: z.string().nullable().optional(),
	no_of_attempts: z.number().default(1),
	shuffle: z.boolean().default(true),
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
	tag_type_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	question_revision_ids: z.array(z.number()).default([]),
	question_sets: z.array(questionSetSchema).default([]),
	state_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	district_ids: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	show_marks: z.boolean().default(false),
	show_result: z.boolean().default(true),
	show_question_palette: z.boolean().default(true),
	bookmark: z.boolean().default(false),
	locale: z.string().default('en-US'),
	certificate_id: z.preprocess((v) => (!v ? null : v), z.coerce.number().nullable()),
	show_feedback_on_completion: z.boolean().default(false),
	show_feedback_immediately: z.boolean().default(false),
	form_id: z.preprocess((v) => (!v ? null : v), z.coerce.number().nullable().optional()),
	omr: z.enum(Object.values(OmrMode)).default(OmrMode.NEVER)
});

export type FormSchema = typeof testSchema;
