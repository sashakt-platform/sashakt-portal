import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SelectedQuestionsList from './SelectedQuestionsList.svelte';

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/components/QuestionPreviewCell.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		render: vi.fn(),
		$$set: vi.fn(),
		$destroy: vi.fn()
	}))
}));

function makeQuestion(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		question_text: '<p>What is 2 + 2?</p>',
		question_type: 'single-choice',
		tags: [],
		options: [
			{ id: 10, key: 'A', value: 'Three' },
			{ id: 11, key: 'B', value: 'Four' }
		],
		correct_answer: [11],
		...overrides
	};
}

describe('SelectedQuestionsList', () => {
	beforeEach(() => {
		(window as Window & { MathJax?: unknown }).MathJax = {
			startup: { promise: Promise.resolve() },
			typesetClear: vi.fn(),
			typesetPromise: vi.fn().mockResolvedValue(undefined)
		};
	});

	describe('Table Header', () => {
		it('renders column headers', () => {
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [],
					selectedQuestionIds: []
				}
			});

			expect(screen.getByText('Questions')).toBeInTheDocument();
			expect(screen.getByText('Answers')).toBeInTheDocument();
			expect(screen.getByText('Tags')).toBeInTheDocument();
		});
	});

	describe('Question Rows', () => {
		it('renders question text via RichText', () => {
			const question = makeQuestion();
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
		});

		it('renders multiple questions', () => {
			const questions = [
				makeQuestion({ id: 1, question_text: '<p>Question one</p>' }),
				makeQuestion({ id: 2, question_text: '<p>Question two</p>' }),
				makeQuestion({ id: 3, question_text: '<p>Question three</p>' })
			];
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: questions,
					selectedQuestionIds: [1, 2, 3]
				}
			});

			expect(screen.getByText('Question one')).toBeInTheDocument();
			expect(screen.getByText('Question two')).toBeInTheDocument();
			expect(screen.getByText('Question three')).toBeInTheDocument();
		});

		it('renders a remove button for each question', () => {
			const questions = [
				makeQuestion({ id: 1 }),
				makeQuestion({ id: 2, question_text: '<p>Second question</p>' })
			];
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: questions,
					selectedQuestionIds: [1, 2]
				}
			});

			const removeButtons = screen.getAllByRole('button', { name: 'Remove question' });
			expect(removeButtons).toHaveLength(2);
		});

		it('renders no rows when selectedQuestions is empty', () => {
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [],
					selectedQuestionIds: []
				}
			});

			expect(screen.queryAllByRole('button', { name: 'Remove question' })).toHaveLength(0);
		});
	});

	describe('Tag Display', () => {
		it('shows tag names for a question', () => {
			const question = makeQuestion({
				tags: [{ name: 'Math', tag_type: { name: 'Subject' } }]
			});
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('Math (Subject)')).toBeInTheDocument();
		});

		it('shows tag name without type when tag_type is missing', () => {
			const question = makeQuestion({
				tags: [{ name: 'Easy' }]
			});
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('Easy')).toBeInTheDocument();
		});

		it('shows at most 2 visible tags', () => {
			const question = makeQuestion({
				tags: [
					{ name: 'Tag1', tag_type: { name: 'Type1' } },
					{ name: 'Tag2', tag_type: { name: 'Type2' } },
					{ name: 'Tag3', tag_type: { name: 'Type3' } }
				]
			});
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('Tag1 (Type1)')).toBeInTheDocument();
			expect(screen.getByText('Tag2 (Type2)')).toBeInTheDocument();
			expect(screen.queryByText('Tag3 (Type3)')).not.toBeInTheDocument();
		});

		it('shows overflow count when there are more than 2 tags', () => {
			const question = makeQuestion({
				tags: [
					{ name: 'Tag1', tag_type: { name: 'T1' } },
					{ name: 'Tag2', tag_type: { name: 'T2' } },
					{ name: 'Tag3', tag_type: { name: 'T3' } }
				]
			});
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('+1')).toBeInTheDocument();
		});

		it('shows overflow count for many tags', () => {
			const question = makeQuestion({
				tags: [
					{ name: 'A' },
					{ name: 'B' },
					{ name: 'C' },
					{ name: 'D' },
					{ name: 'E' }
				]
			});
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('+3')).toBeInTheDocument();
		});

		it('does not show overflow chip when there are 2 or fewer tags', () => {
			const question = makeQuestion({
				tags: [
					{ name: 'Tag1', tag_type: { name: 'T1' } },
					{ name: 'Tag2', tag_type: { name: 'T2' } }
				]
			});
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('Tag1 (T1)')).toBeInTheDocument();
			expect(screen.getByText('Tag2 (T2)')).toBeInTheDocument();
			// No overflow chip
			const tagChips = screen.getAllByText(/./);
			const overflowChip = tagChips.find((el) => el.textContent?.match(/^\+\d+$/));
			expect(overflowChip).toBeUndefined();
		});

		it('renders no tags when question has no tags', () => {
			const question = makeQuestion({ tags: [] });
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.queryByText(/\(.*\)/)).not.toBeInTheDocument();
		});

		it('renders no tags when tags is undefined', () => {
			const question = makeQuestion({ tags: undefined });
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.queryAllByText(/^\+\d+$/)).toHaveLength(0);
		});
	});

	describe('Remove Question', () => {
		it('calls onRemoveQuestion callback when remove button is clicked', async () => {
			const onRemoveQuestion = vi.fn();
			const question = makeQuestion({ id: 42 });
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [42],
					onRemoveQuestion
				}
			});

			await fireEvent.click(screen.getByRole('button', { name: 'Remove question' }));

			expect(onRemoveQuestion).toHaveBeenCalledWith(42);
		});

		it('calls onRemoveQuestion with the correct id when there are multiple questions', async () => {
			const onRemoveQuestion = vi.fn();
			const questions = [
				makeQuestion({ id: 10, question_text: '<p>First</p>' }),
				makeQuestion({ id: 20, question_text: '<p>Second</p>' })
			];
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: questions,
					selectedQuestionIds: [10, 20],
					onRemoveQuestion
				}
			});

			const removeButtons = screen.getAllByRole('button', { name: 'Remove question' });
			await fireEvent.click(removeButtons[1]);

			expect(onRemoveQuestion).toHaveBeenCalledWith(20);
		});

		it('does not throw when onRemoveQuestion is not provided', async () => {
			const question = makeQuestion();
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			await expect(
				fireEvent.click(screen.getByRole('button', { name: 'Remove question' }))
			).resolves.not.toThrow();
		});
	});

	describe('Edge Cases', () => {
		it('handles questions with missing optional fields', () => {
			const question = {
				id: 1,
				question_text: '<p>Minimal question</p>'
			};
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('Minimal question')).toBeInTheDocument();
		});

		it('handles question with empty options array', () => {
			const question = makeQuestion({ options: [] });
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
		});

		it('handles question with tag that has empty tag_type name', () => {
			const question = makeQuestion({
				tags: [{ name: 'Solo', tag_type: { name: '' } }]
			});
			render(SelectedQuestionsList, {
				props: {
					selectedQuestions: [question],
					selectedQuestionIds: [1]
				}
			});

			expect(screen.getByText('Solo')).toBeInTheDocument();
		});
	});
});
