import { z } from 'zod';
import { marksSchema } from '$lib/schemas/marks';
import {
	MAX_NOMENCLATURE_LABEL_LEN,
	NOMENCLATURE_DEFAULTS,
	type NomenclatureKey
} from '$lib/nomenclature';

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

const nomenclatureLabelSchema = z
	.string()
	.max(MAX_NOMENCLATURE_LABEL_LEN, {
		message: `Label must be ${MAX_NOMENCLATURE_LABEL_LEN} characters or fewer`
	})
	.transform((v) => v.trim());

const platformNomenclatureSchema = z.object({
	mode: z.enum(['default', 'custom']),
	value: z.object({
		dashboard: nomenclatureLabelSchema,
		question_bank: nomenclatureLabelSchema,
		tag_management: nomenclatureLabelSchema,
		tests: nomenclatureLabelSchema,
		test: nomenclatureLabelSchema,
		tags: nomenclatureLabelSchema,
		tag: nomenclatureLabelSchema,
		test_templates: nomenclatureLabelSchema,
		test_template: nomenclatureLabelSchema,
		tag_types: nomenclatureLabelSchema,
		tag_type: nomenclatureLabelSchema,
		forms: nomenclatureLabelSchema,
		form: nomenclatureLabelSchema,
		certificates: nomenclatureLabelSchema,
		certificate: nomenclatureLabelSchema,
		entities: nomenclatureLabelSchema,
		entity: nomenclatureLabelSchema,
		users: nomenclatureLabelSchema,
		user: nomenclatureLabelSchema
	})
});

export const organizationSettingsSchema = z.object({
	version: z.literal(2).default(2),
	test_timings: testTimingsSchema,
	questions_per_page: questionsPerPageSchema,
	marking_scheme: markingSchemeSchema,
	answer_review: answerReviewSchema,
	question_palette: questionPaletteSchema,
	mark_for_review: markForReviewSchema,
	omr_mode: omrModeSchema,
	platform_nomenclature: platformNomenclatureSchema
});

export type OrganizationSettingsSchema = typeof organizationSettingsSchema;
export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;
export type AnswerReviewOption = (typeof ANSWER_REVIEW_OPTIONS)[number];
export type SettingMode = (typeof MODE_OPTIONS)[number];

// Defensive: backend should always return a fully-populated nomenclature, but if a
// key is missing (e.g. unmigrated org), fall back to "" so the form is fully populated.
export function fillMissingNomenclatureKeys(
	value: Partial<Record<NomenclatureKey, string>> | undefined | null
): Record<NomenclatureKey, string> {
	const filled = {} as Record<NomenclatureKey, string>;
	for (const key of Object.keys(NOMENCLATURE_DEFAULTS) as NomenclatureKey[]) {
		filled[key] = value?.[key] ?? '';
	}
	return filled;
}

// Backend serializes times as "HH:MM:SS"; <input type="time"> uses "HH:MM".
export function trimSeconds(value: string | null | undefined): string | null {
	if (!value) return null;
	return value.length >= 5 ? value.slice(0, 5) : value;
}

export function withSeconds(value: string | null | undefined): string | null {
	if (!value) return null;
	return value.length === 5 ? `${value}:00` : value;
}
