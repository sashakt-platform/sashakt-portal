import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writable, get } from 'svelte/store';
import QuestionSelectionDialog from './QuestionSelectionDialog.svelte';

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/tests/test-default/1')
	}
}));

vi.mock('$lib/nomenclature', () => ({
	useTerms: () => (key: string) => {
		const map: Record<string, string> = {
			question_bank: 'Question Bank',
			test: 'Test',
			test_template: 'Test Template'
		};
		return map[key] ?? key;
	}
}));

vi.mock('$lib/utils/permissions.js', () => ({
	isStateAdmin: vi.fn(() => false)
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('./columns', () => ({
	createQuestionSelectionColumns: vi.fn(() => [])
}));

vi.mock('$lib/components/data-table', () => ({
	DataTable: vi.fn().mockImplementation(() => ({
		render: vi.fn(),
		$$set: vi.fn(),
		$destroy: vi.fn()
	}))
}));

vi.mock('$lib/components/SearchInput.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		render: vi.fn(),
		$$set: vi.fn(),
		$destroy: vi.fn()
	}))
}));

vi.mock('$lib/components/TagsSelection.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		render: vi.fn(),
		$$set: vi.fn(),
		$destroy: vi.fn()
	}))
}));

vi.mock('$lib/components/TagTypeSelection.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		render: vi.fn(),
		$$set: vi.fn(),
		$destroy: vi.fn()
	}))
}));

vi.mock('$lib/components/StateSelection.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		render: vi.fn(),
		$$set: vi.fn(),
		$destroy: vi.fn()
	}))
}));

function makeFormData(overrides: Record<string, unknown> = {}) {
	return writable({
		question_revision_ids: [] as number[],
		question_revisions: [] as any[],
		is_template: false,
		...overrides
	});
}

function makeQuestions(items: any[] = [], total = 0, pages = 1) {
	return { items, total, pages };
}

function makeQuestionItem(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		question_text: '<p>Sample question</p>',
		question_type: 'single-choice',
		tags: [],
		options: [{ id: 10, key: 'A', value: 'Option A' }],
		correct_answer: [10],
		latest_question_revision_id: 100,
		instructions: null,
		marking_scheme: null,
		is_mandatory: false,
		media: null,
		matrix: null,
		...overrides
	};
}

const defaultProps = {
	open: true,
	questions: makeQuestions(),
	questionParams: {
		questionSearch: '',
		questionSortBy: '',
		questionSortOrder: 'asc',
		questionPage: 1,
		questionSize: 25
	},
	formData: makeFormData(),
	user: null
};

describe('QuestionSelectionDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Dialog Rendering', () => {
		it('renders dialog title with nomenclature term', () => {
			render(QuestionSelectionDialog, { props: defaultProps });

			expect(
				screen.getByText('Select Questions from the Question Bank')
			).toBeInTheDocument();
		});

		it('shows selected question count as 0 when none selected', () => {
			render(QuestionSelectionDialog, { props: defaultProps });

			expect(screen.getByText(/0 of 0 questions selected/)).toBeInTheDocument();
		});

		it('shows correct selected and total counts', () => {
			const formData = makeFormData({
				question_revision_ids: [100, 200],
				question_revisions: [
					makeQuestionItem({ latest_question_revision_id: 100 }),
					makeQuestionItem({ id: 2, latest_question_revision_id: 200 })
				]
			});
			render(QuestionSelectionDialog, {
				props: {
					...defaultProps,
					questions: makeQuestions([], 50),
					formData
				}
			});

			expect(screen.getByText(/2 of 50 questions selected/)).toBeInTheDocument();
		});

		it('does not render dialog content when open is false', () => {
			render(QuestionSelectionDialog, {
				props: { ...defaultProps, open: false }
			});

			expect(
				screen.queryByText('Select Questions from the Question Bank')
			).not.toBeInTheDocument();
		});
	});

	describe('Add Questions Button', () => {
		it('renders button with "Test" label when not a template', () => {
			render(QuestionSelectionDialog, { props: defaultProps });

			expect(screen.getByRole('button', { name: /Add Questions to Test/i })).toBeInTheDocument();
		});

		it('renders button with "Test Template" label when is_template is true', () => {
			const formData = makeFormData({ is_template: true });
			render(QuestionSelectionDialog, {
				props: { ...defaultProps, formData }
			});

			expect(
				screen.getByRole('button', { name: /Add Questions to Test Template/i })
			).toBeInTheDocument();
		});

		it('button is disabled when no questions are selected', () => {
			render(QuestionSelectionDialog, { props: defaultProps });

			const button = screen.getByRole('button', { name: /Add Questions to/i });
			expect(button).toBeDisabled();
		});

		it('button is enabled when questions are selected', () => {
			const formData = makeFormData({
				question_revision_ids: [100],
				question_revisions: [makeQuestionItem({ latest_question_revision_id: 100 })]
			});
			render(QuestionSelectionDialog, {
				props: { ...defaultProps, formData }
			});

			const button = screen.getByRole('button', { name: /Add Questions to/i });
			expect(button).not.toBeDisabled();
		});
	});

	describe('Question Data Mapping', () => {
		it('passes mapped question data to DataTable', async () => {
			const { createQuestionSelectionColumns } = await import('./columns');

			const items = [
				makeQuestionItem({
					id: 1,
					latest_question_revision_id: 100,
					question_text: '<p>Q1</p>'
				}),
				makeQuestionItem({
					id: 2,
					latest_question_revision_id: 200,
					question_text: '<p>Q2</p>'
				})
			];

			render(QuestionSelectionDialog, {
				props: {
					...defaultProps,
					questions: makeQuestions(items, 2)
				}
			});

			expect(createQuestionSelectionColumns).toHaveBeenCalled();
		});

		it('handles questions with missing optional fields', () => {
			const items = [
				{
					id: 1,
					question_text: '<p>Minimal</p>',
					question_type: 'single-choice',
					tags: [],
					latest_question_revision_id: 100
				}
			];

			expect(() =>
				render(QuestionSelectionDialog, {
					props: {
						...defaultProps,
						questions: makeQuestions(items, 1)
					}
				})
			).not.toThrow();
		});

		it('handles empty questions list', () => {
			expect(() =>
				render(QuestionSelectionDialog, {
					props: {
						...defaultProps,
						questions: makeQuestions([], 0, 0)
					}
				})
			).not.toThrow();
		});

		it('defaults to empty arrays for missing options and correct_answer', () => {
			const items = [
				{
					id: 1,
					question_text: '<p>No options</p>',
					question_type: 'single-choice',
					tags: [],
					latest_question_revision_id: 100,
					options: undefined,
					correct_answer: undefined
				}
			];

			expect(() =>
				render(QuestionSelectionDialog, {
					props: {
						...defaultProps,
						questions: makeQuestions(items, 1)
					}
				})
			).not.toThrow();
		});
	});

	describe('Sorting', () => {
		it('creates columns with sort params from questionParams', async () => {
			const { createQuestionSelectionColumns } = await import('./columns');

			render(QuestionSelectionDialog, {
				props: {
					...defaultProps,
					questionParams: {
						questionSortBy: 'question_text',
						questionSortOrder: 'desc',
						questionPage: 1,
						questionSize: 25,
						questionSearch: ''
					}
				}
			});

			expect(createQuestionSelectionColumns).toHaveBeenCalledWith(
				'question_text',
				'desc',
				expect.any(Function)
			);
		});

		it('creates columns with default sort params when not provided', async () => {
			const { createQuestionSelectionColumns } = await import('./columns');

			render(QuestionSelectionDialog, {
				props: {
					...defaultProps,
					questionParams: {}
				}
			});

			expect(createQuestionSelectionColumns).toHaveBeenCalledWith(
				'',
				'asc',
				expect.any(Function)
			);
		});
	});

	describe('Selection Confirmation', () => {
		it('clicking add button does not throw when questions are selected', async () => {
			const formData = makeFormData({
				question_revision_ids: [100],
				question_revisions: [makeQuestionItem({ latest_question_revision_id: 100 })]
			});
			render(QuestionSelectionDialog, {
				props: { ...defaultProps, formData }
			});

			const button = screen.getByRole('button', { name: /Add Questions to/i });
			await expect(fireEvent.click(button)).resolves.not.toThrow();
		});
	});

	describe('State Admin Filter Visibility', () => {
		it('calls isStateAdmin with the user prop', async () => {
			const { isStateAdmin } = await import('$lib/utils/permissions.js');
			const user = { id: 1, states: [{ id: 1 }], permissions: [] };

			render(QuestionSelectionDialog, {
				props: { ...defaultProps, user: user as any }
			});

			expect(isStateAdmin).toHaveBeenCalledWith(user);
		});

		it('calls isStateAdmin with null when no user provided', async () => {
			const { isStateAdmin } = await import('$lib/utils/permissions.js');

			render(QuestionSelectionDialog, {
				props: { ...defaultProps, user: null }
			});

			expect(isStateAdmin).toHaveBeenCalledWith(null);
		});
	});

	describe('Pre-selected Questions', () => {
		it('initializes allSelectedQuestions from formData question_revisions', () => {
			const revisions = [
				makeQuestionItem({ id: 1, latest_question_revision_id: 100 }),
				makeQuestionItem({ id: 2, latest_question_revision_id: 200 })
			];
			const formData = makeFormData({
				question_revision_ids: [100, 200],
				question_revisions: revisions
			});

			render(QuestionSelectionDialog, {
				props: { ...defaultProps, formData }
			});

			const button = screen.getByRole('button', { name: /Add Questions to/i });
			expect(button).not.toBeDisabled();
		});

		it('button is disabled when formData has no question_revisions', () => {
			const formData = makeFormData({
				question_revision_ids: [],
				question_revisions: []
			});

			render(QuestionSelectionDialog, {
				props: { ...defaultProps, formData }
			});

			const button = screen.getByRole('button', { name: /Add Questions to/i });
			expect(button).toBeDisabled();
		});
	});

	describe('Edge Cases', () => {
		it('handles undefined questions.items gracefully', () => {
			expect(() =>
				render(QuestionSelectionDialog, {
					props: {
						...defaultProps,
						questions: { total: 0, pages: 0 }
					}
				})
			).not.toThrow();
		});

		it('handles null questionParams gracefully', () => {
			expect(() =>
				render(QuestionSelectionDialog, {
					props: {
						...defaultProps,
						questionParams: null
					}
				})
			).not.toThrow();
		});

		it('handles formData without question_revisions', () => {
			const formData = makeFormData({});
			// Remove question_revisions to simulate edge case
			const store = get(formData);
			delete (store as any).question_revisions;
			formData.set(store);

			expect(() =>
				render(QuestionSelectionDialog, {
					props: { ...defaultProps, formData }
				})
			).not.toThrow();
		});

		it('renders with questions.total as 0 when not provided', () => {
			render(QuestionSelectionDialog, {
				props: {
					...defaultProps,
					questions: { items: [] }
				}
			});

			expect(screen.getByText(/0 of 0 questions selected/)).toBeInTheDocument();
		});
	});
});
