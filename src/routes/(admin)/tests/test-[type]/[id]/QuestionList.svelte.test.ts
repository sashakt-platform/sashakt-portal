import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import { get, writable } from 'svelte/store';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

	describe('header label', () => {
		it('shows "Select Questions" by default', () => {
			const formData = makeFormData();

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('Select Questions')).toBeInTheDocument();
		});

		it('shows "Review Questions" when creating from a template', () => {
			const formData = makeFormData();

			render(QuestionList, {
				formData,
				questions: [],
				questionParams: {},
				user: null,
				convertTemplate: true
			});

			expect(screen.getByText('Review Questions')).toBeInTheDocument();
			expect(screen.queryByText('Select Questions')).not.toBeInTheDocument();
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
			expect(screen.getByText('Questions Required')).toBeInTheDocument();
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

		it('does not auto-add a new tag_ids tag once random_tag_count already has entries', async () => {
			// Simulates editing a saved test where the user added a third tag on the Primary
			// page before navigating to Questions. random_tag_count already has entries (the
			// user has taken ownership of this list), so History is not auto-applied — otherwise
			// a tag intentionally removed here would keep reappearing as long as it stays in tag_ids.
			const formData = makeFormData({
				tag_ids: [
					{ id: '1', name: 'Science' },
					{ id: '2', name: 'Maths' },
					{ id: '3', name: 'History' }
				],
				random_tag_count: [
					{ id: '1', name: 'Science', count: 5 },
					{ id: '2', name: 'Maths', count: 3 }
				],
				question_revision_ids: []
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(screen.getByText('Science')).toBeInTheDocument();
			expect(screen.getByText('Maths')).toBeInTheDocument();
			expect(screen.queryByText('History')).not.toBeInTheDocument();
			expect(get(formData).random_tag_count).toEqual([
				{ id: '1', name: 'Science', count: 5 },
				{ id: '2', name: 'Maths', count: 3 }
			]);
		});

		it('keeps a tag in random_tag_count even after it has been removed from tag_ids', async () => {
			// Simulates editing a saved test where the user removed Maths on the Primary
			// page before navigating to Questions. Maths was picked directly on the
			// Questions page (independent of tag_ids), so it must survive the mount-time
			// sync rather than being silently dropped along with its count.
			const formData = makeFormData({
				tag_ids: [{ id: '1', name: 'Science' }],
				random_tag_count: [
					{ id: '1', name: 'Science', count: 5 },
					{ id: '2', name: 'Maths', count: 3 }
				],
				question_revision_ids: []
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(screen.getByText('Science')).toBeInTheDocument();
			});

			expect(screen.getByText('Maths')).toBeInTheDocument();
			expect(get(formData).random_tag_count).toEqual([
				{ id: '1', name: 'Science', count: 5 },
				{ id: '2', name: 'Maths', count: 3 }
			]);
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

	describe('switching selection mode with unsaved selections', () => {
		it('warns before discarding manually selected questions when switching to Auto Selection', async () => {
			const formData = makeFormData({
				question_revision_ids: [101, 102],
				question_revisions: [
					{ id: 101, question_text: 'Q1', tags: [] },
					{ id: 102, question_text: 'Q2', tags: [] }
				]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await fireEvent.click(screen.getByText('Auto Selection'));

			expect(screen.getByText('Switch selection mode?')).toBeInTheDocument();
			expect(get(formData).question_revision_ids).toEqual([101, 102]);
		});

		it('keeps the current tab and selections when the switch is cancelled', async () => {
			const formData = makeFormData({
				question_revision_ids: [101, 102],
				question_revisions: [
					{ id: 101, question_text: 'Q1', tags: [] },
					{ id: 102, question_text: 'Q2', tags: [] }
				]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await fireEvent.click(screen.getByText('Auto Selection'));
			await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

			expect(screen.queryByText('Switch selection mode?')).not.toBeInTheDocument();
			expect(screen.getByText(/2 questions added/)).toBeInTheDocument();
			expect(get(formData).question_revision_ids).toEqual([101, 102]);
		});

		it('clears manually selected questions and switches tabs when the switch is confirmed', async () => {
			const formData = makeFormData({
				question_revision_ids: [101, 102],
				question_revisions: [
					{ id: 101, question_text: 'Q1', tags: [] },
					{ id: 102, question_text: 'Q2', tags: [] }
				]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await fireEvent.click(screen.getByText('Auto Selection'));
			await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

			expect(screen.queryByText('Switch selection mode?')).not.toBeInTheDocument();
			expect(get(formData).question_revision_ids).toEqual([]);
			expect(get(formData).question_revisions).toEqual([]);
			expect(
				screen.getByText(/Select tags and specify how many questions to randomly pull from each/)
			).toBeInTheDocument();
		});

		it('warns before discarding random tag rules when switching to Manual Selection', async () => {
			const formData = makeFormData({
				tag_ids: [{ id: '1', name: 'Science' }],
				random_tag_count: [{ id: '1', name: 'Science', count: 5 }]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await fireEvent.click(screen.getByText('Manual Selection'));

			expect(screen.getByText('Switch selection mode?')).toBeInTheDocument();
			expect(get(formData).random_tag_count).toEqual([{ id: '1', name: 'Science', count: 5 }]);
		});

		it('switches tabs immediately when the current tab has no selections', async () => {
			const formData = makeFormData();

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await fireEvent.click(screen.getByText('Manual Selection'));

			expect(screen.queryByText('Switch selection mode?')).not.toBeInTheDocument();
			expect(screen.getByText('No questions yet')).toBeInTheDocument();
		});
	});

	describe('available question counts', () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		function mockCountByTagsFetch(counts: { tag_id: number; question_count: number }[] = []) {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => counts
			});
		}

		it('fetches and displays the available question count for each selected tag', async () => {
			mockCountByTagsFetch([
				{ tag_id: 1, question_count: 5 },
				{ tag_id: 2, question_count: 0 }
			]);

			const formData = makeFormData({
				random_tag_count: [
					{ id: '1', name: 'Science' },
					{ id: '2', name: 'Maths' }
				]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(screen.getByText('5')).toBeInTheDocument();
			});
			expect(screen.getByText('0')).toBeInTheDocument();
		});

		it('shows "—" for a tag missing from the API response', async () => {
			mockCountByTagsFetch([{ tag_id: 1, question_count: 5 }]);

			const formData = makeFormData({
				random_tag_count: [
					{ id: '1', name: 'Science' },
					{ id: '2', name: 'Maths' }
				]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(screen.getByText('5')).toBeInTheDocument();
			});
			expect(screen.getByText('—')).toBeInTheDocument();
		});

		it('does not call fetch when random_tag_count is empty', () => {
			mockCountByTagsFetch([]);

			const formData = makeFormData({ tag_ids: [], random_tag_count: [] });

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('includes every selected tag id in the request URL', async () => {
			mockCountByTagsFetch([]);

			const formData = makeFormData({
				random_tag_count: [
					{ id: '1', name: 'Science' },
					{ id: '2', name: 'Maths' }
				]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalled();
			});
			const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(calledUrl).toContain('tag_ids=1');
			expect(calledUrl).toContain('tag_ids=2');
		});

		it('refetches when a new tag is added to random_tag_count', async () => {
			mockCountByTagsFetch([{ tag_id: 1, question_count: 5 }]);

			const formData = makeFormData({
				random_tag_count: [{ id: '1', name: 'Science' }]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledTimes(1);
			});

			formData.update((data: any) => ({
				...data,
				random_tag_count: [...data.random_tag_count, { id: '2', name: 'Maths' }]
			}));

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledTimes(2);
			});
			const secondUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][0] as string;
			expect(secondUrl).toContain('tag_ids=1');
			expect(secondUrl).toContain('tag_ids=2');
		});

		it('does not refetch when only the requested count changes for an existing tag', async () => {
			mockCountByTagsFetch([{ tag_id: 1, question_count: 5 }]);

			const formData = makeFormData({
				random_tag_count: [{ id: '1', name: 'Science', count: 2 }]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledTimes(1);
			});

			const input = screen.getByPlaceholderText('e.g. 5');
			await fireEvent.input(input, { target: { value: '3' } });

			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('shows a warning when the requested count exceeds the available count', async () => {
			mockCountByTagsFetch([{ tag_id: 1, question_count: 3 }]);

			const formData = makeFormData({
				random_tag_count: [{ id: '1', name: 'Science', count: 5 }]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(screen.getByText('Only 3 questions available for this tag')).toBeInTheDocument();
			});
		});

		it('does not show the warning when the requested count is within the available count', async () => {
			mockCountByTagsFetch([{ tag_id: 1, question_count: 3 }]);

			const formData = makeFormData({
				random_tag_count: [{ id: '1', name: 'Science', count: 2 }]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(screen.getByText('3')).toBeInTheDocument();
			});
			expect(screen.queryByText(/available for this tag/)).not.toBeInTheDocument();
		});

		it('renders without crashing when the fetch fails', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('network error'));

			const formData = makeFormData({
				random_tag_count: [{ id: '1', name: 'Science' }]
			});

			render(QuestionList, { formData, questions: [], questionParams: {}, user: null });

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalled();
			});
			expect(screen.getByText('Science')).toBeInTheDocument();
			expect(screen.getByText('—')).toBeInTheDocument();
		});
	});
});
