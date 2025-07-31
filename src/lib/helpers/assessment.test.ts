import { describe, test, expect } from 'vitest';
import { questionSchema } from '../../routes/(admin)/questionbank/single-question/[id]/schema.js';

describe('Question Validation Rules', () => {
	test('should require at least 2 options for multiple choice questions', () => {
		const questionWithOneOption = {
			question_text: 'What is the capital of India?',
			question_type: 'single-choice' as const,
			options: [{ id: 1, key: 'A', value: 'Delhi' }], // Only 1 option - invalid
			correct_answer: [1],
			organization_id: 1
		};

		const result = questionSchema.safeParse(questionWithOneOption);
		expect(result.success).toBe(false);
	});

	test('should require at least one correct answer', () => {
		const questionWithNoCorrectAnswer = {
			question_text: 'What is 2+2?',
			question_type: 'single-choice' as const,
			options: [
				{ id: 1, key: 'A', value: '3' },
				{ id: 2, key: 'B', value: '4' }
			],
			correct_answer: [], // No correct answer - invalid
			organization_id: 1
		};

		const result = questionSchema.safeParse(questionWithNoCorrectAnswer);
		expect(result.success).toBe(false);
	});

	test('should create valid assessment question', () => {
		const validQuestion = {
			question_text: 'What is the capital of India?',
			question_type: 'single-choice' as const,
			options: [
				{ id: 1, key: 'A', value: 'Mumbai' },
				{ id: 2, key: 'B', value: 'Delhi' },
				{ id: 3, key: 'C', value: 'Kolkata' }
			],
			correct_answer: [2],
			organization_id: 1,
			tag_ids: ['geography'],
			state_ids: ['1']
		};

		const result = questionSchema.safeParse(validQuestion);
		expect(result.success).toBe(true);

		if (result.success) {
			expect(result.data.is_mandatory).toBe(false); // default
			expect(result.data.is_active).toBe(true); // default
		}
	});
});
