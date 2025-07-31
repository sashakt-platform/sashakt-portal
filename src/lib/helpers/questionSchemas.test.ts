import { describe, test, expect } from 'vitest';
import { z } from 'zod';

// 📝 Question Schema Validation - Testing the business rules!

// Recreate schemas for testing
const optionSchema = z.object({
	id: z.number().int(),
	key: z.string(),
	value: z.string()
});

export const questionSchema = z.object({
	question_text: z.string().nonempty({ message: 'Question text is required' }),
	instructions: z.string().nullable().optional(),
	question_type: z.enum(['single-choice', 'multi-choice']).default('single-choice'),
	options: z.array(optionSchema).min(2).default([]),
	correct_answer: z.array(z.number().int()).min(1).default([]),
	subjective_answer_limit: z.number().int().positive().nullable().optional(),
	is_mandatory: z.boolean().default(false),
	solution: z.string().nullable().optional(),
	organization_id: z.number().int().positive(),
	state_ids: z.array(z.string()).default([]),
	district_ids: z.array(z.string()).default([]),
	block_ids: z.array(z.string()).default([]),
	tag_ids: z.array(z.string()).default([]),
	is_active: z.boolean().default(true)
});

export const tagSchema = z.object({
	description: z.string().nullable().optional(),
	name: z.string().nonempty({ message: 'Tag name is required' }),
	tag_type_id: z.number().nullable().default(null).optional()
});

// Business logic helpers for question validation
export function validateQuestionBusinessRules(data: any) {
	const errors: string[] = [];

	// Single choice questions can only have one correct answer
	if (data.question_type === 'single-choice' && data.correct_answer.length > 1) {
		errors.push('Single choice questions can have only one correct answer');
	}

	// Multi choice questions should have at least one but not all correct answers
	if (data.question_type === 'multi-choice') {
		if (data.correct_answer.length === 0) {
			errors.push('Multi choice questions must have at least one correct answer');
		}
		if (data.correct_answer.length === data.options.length) {
			errors.push('Multi choice questions cannot have all options as correct');
		}
	}

	// Correct answers must reference existing options
	const optionIds = data.options.map((opt: any) => opt.id);
	const invalidAnswers = data.correct_answer.filter((id: number) => !optionIds.includes(id));
	if (invalidAnswers.length > 0) {
		errors.push('Correct answers must reference existing options');
	}

	// Options must have unique keys
	const keys = data.options.map((opt: any) => opt.key);
	const uniqueKeys = [...new Set(keys)];
	if (keys.length !== uniqueKeys.length) {
		errors.push('Option keys must be unique');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

describe('Question Schema Validation', () => {
	test('questionSchema should validate basic question structure', () => {
		const validQuestion = {
			question_text: 'What is the capital of France?',
			question_type: 'single-choice' as const,
			options: [
				{ id: 1, key: 'A', value: 'London' },
				{ id: 2, key: 'B', value: 'Paris' },
				{ id: 3, key: 'C', value: 'Berlin' }
			],
			correct_answer: [2],
			organization_id: 1,
			tag_ids: ['1', '2'],
			state_ids: ['1']
		};

		const result = questionSchema.safeParse(validQuestion);
		expect(result.success).toBe(true);

		if (result.success) {
			expect(result.data.is_mandatory).toBe(false); // default value
			expect(result.data.is_active).toBe(true); // default value
		}
	});

	test('questionSchema should enforce minimum requirements', () => {
		// Missing question text
		const noText = {
			question_type: 'single-choice',
			options: [
				{ id: 1, key: 'A', value: 'Option A' },
				{ id: 2, key: 'B', value: 'Option B' }
			],
			correct_answer: [1],
			organization_id: 1
		};

		const noTextResult = questionSchema.safeParse(noText);
		expect(noTextResult.success).toBe(false);

		// Too few options
		const fewOptions = {
			question_text: 'Test question?',
			options: [{ id: 1, key: 'A', value: 'Only one option' }],
			correct_answer: [1],
			organization_id: 1
		};

		const fewOptionsResult = questionSchema.safeParse(fewOptions);
		expect(fewOptionsResult.success).toBe(false);

		// No correct answers
		const noCorrect = {
			question_text: 'Test question?',
			options: [
				{ id: 1, key: 'A', value: 'Option A' },
				{ id: 2, key: 'B', value: 'Option B' }
			],
			correct_answer: [],
			organization_id: 1
		};

		const noCorrectResult = questionSchema.safeParse(noCorrect);
		expect(noCorrectResult.success).toBe(false);
	});

	test('optionSchema should validate option structure', () => {
		// Valid option
		const validOption = { id: 1, key: 'A', value: 'Option A' };
		const validResult = optionSchema.safeParse(validOption);
		expect(validResult.success).toBe(true);

		// Invalid - missing required fields
		const invalidOptions = [
			{ key: 'A', value: 'Option A' }, // missing id
			{ id: 1, value: 'Option A' }, // missing key
			{ id: 1, key: 'A' }, // missing value
			{ id: 'not_number', key: 'A', value: 'Option A' } // invalid id type
		];

		invalidOptions.forEach((option) => {
			const result = optionSchema.safeParse(option);
			expect(result.success).toBe(false);
		});
	});

	test('validateQuestionBusinessRules should enforce question type constraints', () => {
		// Valid single choice
		const validSingleChoice = {
			question_type: 'single-choice',
			options: [
				{ id: 1, key: 'A', value: 'Option A' },
				{ id: 2, key: 'B', value: 'Option B' },
				{ id: 3, key: 'C', value: 'Option C' }
			],
			correct_answer: [2]
		};

		const validSingleResult = validateQuestionBusinessRules(validSingleChoice);
		expect(validSingleResult.valid).toBe(true);
		expect(validSingleResult.errors).toHaveLength(0);

		// Invalid single choice - multiple correct answers
		const invalidSingleChoice = {
			...validSingleChoice,
			correct_answer: [1, 2]
		};

		const invalidSingleResult = validateQuestionBusinessRules(invalidSingleChoice);
		expect(invalidSingleResult.valid).toBe(false);
		expect(invalidSingleResult.errors).toContain(
			'Single choice questions can have only one correct answer'
		);

		// Valid multi choice
		const validMultiChoice = {
			question_type: 'multi-choice',
			options: [
				{ id: 1, key: 'A', value: 'Option A' },
				{ id: 2, key: 'B', value: 'Option B' },
				{ id: 3, key: 'C', value: 'Option C' }
			],
			correct_answer: [1, 3]
		};

		const validMultiResult = validateQuestionBusinessRules(validMultiChoice);
		expect(validMultiResult.valid).toBe(true);

		// Invalid multi choice - all options correct
		const allCorrectMulti = {
			...validMultiChoice,
			correct_answer: [1, 2, 3]
		};

		const allCorrectResult = validateQuestionBusinessRules(allCorrectMulti);
		expect(allCorrectResult.valid).toBe(false);
		expect(allCorrectResult.errors).toContain(
			'Multi choice questions cannot have all options as correct'
		);
	});

	test('validateQuestionBusinessRules should validate option key uniqueness', () => {
		const duplicateKeys = {
			question_type: 'single-choice',
			options: [
				{ id: 1, key: 'A', value: 'Option 1' },
				{ id: 2, key: 'A', value: 'Option 2' }, // Duplicate key
				{ id: 3, key: 'B', value: 'Option 3' }
			],
			correct_answer: [1]
		};

		const result = validateQuestionBusinessRules(duplicateKeys);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Option keys must be unique');
	});

	test('validateQuestionBusinessRules should validate correct answer references', () => {
		const invalidReferences = {
			question_type: 'single-choice',
			options: [
				{ id: 1, key: 'A', value: 'Option A' },
				{ id: 2, key: 'B', value: 'Option B' }
			],
			correct_answer: [3, 4] // These IDs don't exist in options
		};

		const result = validateQuestionBusinessRules(invalidReferences);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Correct answers must reference existing options');
	});

	test('tagSchema should validate tag creation', () => {
		// Valid tag with all fields
		const validTag = {
			name: 'Mathematics',
			description: 'Questions related to mathematical concepts',
			tag_type_id: 1
		};

		const validResult = tagSchema.safeParse(validTag);
		expect(validResult.success).toBe(true);

		// Valid tag with minimal fields
		const minimalTag = {
			name: 'Geography'
		};

		const minimalResult = tagSchema.safeParse(minimalTag);
		expect(minimalResult.success).toBe(true);

		if (minimalResult.success) {
			expect(minimalResult.data.tag_type_id).toBeUndefined(); // not set, so undefined
		}

		// Invalid - empty name
		const emptyName = {
			name: '',
			description: 'Some description'
		};

		const emptyNameResult = tagSchema.safeParse(emptyName);
		expect(emptyNameResult.success).toBe(false);

		// Invalid - missing name
		const noName = {
			description: 'Some description',
			tag_type_id: 1
		};

		const noNameResult = tagSchema.safeParse(noName);
		expect(noNameResult.success).toBe(false);
	});
});
