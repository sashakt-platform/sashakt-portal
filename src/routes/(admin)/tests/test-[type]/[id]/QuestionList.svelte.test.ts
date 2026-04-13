import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';
import QuestionList from './QuestionList.svelte';

vi.mock('./question-selection/QuestionSelectionDialog.svelte', () => ({
	default: function MockQuestionSelectionDialog() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('./question-selection/SelectedQuestionsList.svelte', () => ({
	default: function MockSelectedQuestionsList() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('$lib/components/TagsSelection.svelte', () => ({
	default: function MockTagsSelection() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost:5173/tests/test-session/29')
	}
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

describe('QuestionList', () => {
	it('shows sectioned tests as total pool plus answer limit', () => {
		const formData = writable({
			name: 'JEE Combined Chapter Test 6',
			is_template: false,
			question_revision_ids: [],
			question_revisions: [],
			random_tag_count: [],
			tag_ids: [],
			question_sets: [
				{
					id: 12,
					title: 'Chemistry',
					display_order: 1,
					max_questions_allowed_to_attempt: 13,
					question_revision_ids: Array.from({ length: 25 }, (_, index) => index + 1),
					question_revisions: Array.from({ length: 25 }, (_, index) => ({
						id: index + 1,
						question_text: `Chemistry question ${index + 1}`
					}))
				},
				{
					id: 13,
					title: 'Maths',
					display_order: 2,
					max_questions_allowed_to_attempt: 13,
					question_revision_ids: Array.from({ length: 25 }, (_, index) => index + 101),
					question_revisions: Array.from({ length: 25 }, (_, index) => ({
						id: index + 101,
						question_text: `Maths question ${index + 1}`
					}))
				}
			]
		});

		render(QuestionList, {
			formData,
			questions: [],
			questionParams: {},
			user: null
		});

		expect(screen.getByText('50 questions across 2 sections')).toBeInTheDocument();
		expect(screen.getByText('Answer up to 26 across all sections')).toBeInTheDocument();
	});
});
