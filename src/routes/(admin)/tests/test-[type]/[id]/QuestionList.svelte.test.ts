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

vi.mock('./SectionedQuestionSets.svelte', () => ({
	default: function MockSectionedQuestionSets() {
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

function makeSection(
	id: number,
	title: string,
	questionCount: number,
	attemptLimit: number,
	displayOrder = 1
) {
	return {
		id,
		title,
		display_order: displayOrder,
		max_questions_allowed_to_attempt: attemptLimit,
		question_revision_ids: Array.from({ length: questionCount }, (_, i) => id * 100 + i),
		question_revisions: Array.from({ length: questionCount }, (_, i) => ({
			id: id * 100 + i,
			question_text: `${title} question ${i + 1}`
		}))
	};
}

function makeFormData(overrides: Record<string, unknown> = {}) {
	return writable({
		name: 'Test',
		is_template: false,
		question_revision_ids: [],
		question_revisions: [],
		random_tag_count: [],
		tag_ids: [],
		question_sets: [],
		...overrides
	});
}

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

	describe('sectioned test', () => {
		it('does not show attempt limit when limit equals total question count', () => {
			const formData = makeFormData({
				question_sets: [makeSection(1, 'Physics', 20, 20)]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('20 questions across 1 section')).toBeInTheDocument();
			expect(screen.queryByText(/Answer up to/)).not.toBeInTheDocument();
		});

		it('uses singular "question" and "section" for one question in one section', () => {
			const formData = makeFormData({
				question_sets: [makeSection(1, 'Physics', 1, 1)]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('1 question across 1 section')).toBeInTheDocument();
			expect(screen.queryByText(/Answer up to/)).not.toBeInTheDocument();
		});

		it('uses singular "section" and plural "questions" for one section with multiple questions', () => {
			const formData = makeFormData({
				question_sets: [makeSection(1, 'Physics', 15, 10)]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('15 questions across 1 section')).toBeInTheDocument();
			expect(screen.getByText('Answer up to 10 across all sections')).toBeInTheDocument();
		});

		it('counts questions from question_revision_ids when question_revisions is empty', () => {
			const formData = makeFormData({
				question_sets: [
					{
						id: 1,
						title: 'Biology',
						display_order: 1,
						max_questions_allowed_to_attempt: 8,
						question_revision_ids: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
						question_revisions: []
					}
				]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('10 questions across 1 section')).toBeInTheDocument();
			expect(screen.getByText('Answer up to 8 across all sections')).toBeInTheDocument();
		});

		it('shows review description text for a test', () => {
			const formData = makeFormData({
				is_template: false,
				question_sets: [makeSection(1, 'Chemistry', 10, 10)]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(
				screen.getByText('Review the sectioned questions included in this test.')
			).toBeInTheDocument();
		});

		it('shows review description text for a template', () => {
			const formData = makeFormData({
				is_template: true,
				question_sets: [makeSection(1, 'Chemistry', 10, 10)]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(
				screen.getByText('Review the sectioned questions included in this template.')
			).toBeInTheDocument();
		});

		it('hides manual and auto selection tabs', () => {
			const formData = makeFormData({
				question_sets: [makeSection(1, 'Maths', 20, 15)]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.queryByText('Manual Selection')).not.toBeInTheDocument();
			expect(screen.queryByText('Auto Selection')).not.toBeInTheDocument();
		});

		it('shows manual and auto selection tabs when question_sets is empty', () => {
			const formData = makeFormData({ question_sets: [] });

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('Manual Selection')).toBeInTheDocument();
			expect(screen.getByText('Auto Selection')).toBeInTheDocument();
		});
	});

	describe('auto selection — tags carried over from Primary screen', () => {
		it('defaults to Auto Selection mode when tags were selected and no explicit question IDs exist', () => {
			const formData = makeFormData({
				tag_ids: [{ id: '1', name: 'Science' }],
				question_revision_ids: [],
				random_tag_count: []
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('Auto Selection')).toBeInTheDocument();
			expect(screen.queryByText('No questions yet')).not.toBeInTheDocument();
		});

		it('populates the auto-selection table with tag names from tag_ids', () => {
			const formData = makeFormData({
				tag_ids: [
					{ id: '1', name: 'Science' },
					{ id: '2', name: 'Maths' }
				],
				question_revision_ids: [],
				random_tag_count: []
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('Science')).toBeInTheDocument();
			expect(screen.getByText('Maths')).toBeInTheDocument();
		});

		it('shows the "Tags" and "No. of Questions" column headers when tags are present', () => {
			const formData = makeFormData({
				tag_ids: [{ id: '3', name: 'History' }],
				question_revision_ids: [],
				random_tag_count: []
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('Tags')).toBeInTheDocument();
			expect(screen.getByText('No. of Questions')).toBeInTheDocument();
		});

		it('shows the auto-selection description text', () => {
			const formData = makeFormData({
				tag_ids: [{ id: '1', name: 'Science' }],
				question_revision_ids: [],
				random_tag_count: []
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(
				screen.getByText(/Select tags and specify how many questions to randomly pull from each/)
			).toBeInTheDocument();
		});

		it('uses Manual Selection mode when explicit question IDs exist, even if tags are set', () => {
			const formData = makeFormData({
				tag_ids: [{ id: '1', name: 'Science' }],
				question_revision_ids: [101, 102],
				question_revisions: [
					{ id: 101, question_text: 'Q1', tags: [] },
					{ id: 102, question_text: 'Q2', tags: [] }
				],
				random_tag_count: []
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			// Manual mode shows the question count header, not the auto-selection description
			expect(screen.queryByText(/Select tags and specify/)).not.toBeInTheDocument();
			expect(screen.getByText(/2 questions added/)).toBeInTheDocument();
		});
	});
});
