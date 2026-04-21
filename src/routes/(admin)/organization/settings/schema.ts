import { z } from 'zod';
import { marksSchema } from '$lib/schemas/marks';

export const ANSWER_REVIEW_OPTIONS = [
	'off',
	'after_each_question',
	'end_of_test',
	'after_question_and_after_test'
] as const;

export const MODE_OPTIONS = ['fixed', 'flexible'] as const;

// HH:MM or HH:MM:SS
const timeStringSchema = z
	.string()
	.regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'Expected HH:MM or HH:MM:SS' })
	.nullable()
	.optional();

const modeSchema = z.enum(MODE_OPTIONS);

const testTimingsSchema = z.object({
	mode: modeSchema,
	value: z.object({
		time_limit: z.number().int().min(1).nullable().optional(),
		start_time: timeStringSchema,
		end_time: timeStringSchema
	})
});

const questionsPerPageSchema = z.object({
	mode: modeSchema,
	value: z.object({
		question_pagination: z.number().int().min(0).default(1)
	})
});

const markingSchemeSchema = z.object({
	mode: modeSchema,
	value: marksSchema
});

const answerReviewSchema = z.object({
	mode: modeSchema,
	value: z.object({
		default: z.enum(ANSWER_REVIEW_OPTIONS).default('off')
	})
});

const questionPaletteSchema = z.object({
	mode: modeSchema,
	value: z.object({
		default: z.boolean().default(true)
	})
});

const markForReviewSchema = z.object({
	mode: modeSchema,
	value: z.object({
		default: z.boolean().default(true)
	})
});

const omrModeSchema = z.object({
	mode: modeSchema,
	value: z.object({
		default: z.boolean().default(false)
	})
});

export const organizationSettingsSchema = z.object({
	version: z.literal(1).default(1),
	test_timings: testTimingsSchema,
	questions_per_page: questionsPerPageSchema,
	marking_scheme: markingSchemeSchema,
	answer_review: answerReviewSchema,
	question_palette: questionPaletteSchema,
	mark_for_review: markForReviewSchema,
	omr_mode: omrModeSchema
});

export type OrganizationSettingsSchema = typeof organizationSettingsSchema;
export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;
export type AnswerReviewOption = (typeof ANSWER_REVIEW_OPTIONS)[number];
export type SettingMode = (typeof MODE_OPTIONS)[number];

// Backend serializes times as "HH:MM:SS"; <input type="time"> uses "HH:MM".
export function trimSeconds(value: string | null | undefined): string | null {
	if (!value) return null;
	return value.length >= 5 ? value.slice(0, 5) : value;
}

export function withSeconds(value: string | null | undefined): string | null {
	if (!value) return null;
	return value.length === 5 ? `${value}:00` : value;
}
