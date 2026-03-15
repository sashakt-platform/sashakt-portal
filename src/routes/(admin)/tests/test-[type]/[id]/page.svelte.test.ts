import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import TestCreatePage from './+page.svelte';
import { superForm } from 'sveltekit-superforms';

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn()
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn(() => 'mock-zod4-client')
}));

// Mock child screens so this test only exercises the parent shell
vi.mock('./Primary.svelte', () => ({
	default: function MockPrimary() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('./QuestionList.svelte', () => ({
	default: function MockQuestionList() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('./Configuration.svelte', () => ({
	default: function MockConfiguration() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('$lib/utils/permissions.js', () => ({
	isStateAdmin: vi.fn(() => false),
	hasAssignedDistricts: vi.fn(() => false),
	getUserState: vi.fn(() => null),
	getUserDistrict: vi.fn(() => null)
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultFormValues = {
	name: '',
	description: '',
	is_template: false,
	is_active: true,
	random_questions: false,
	no_of_random_questions: 0,
	question_revision_ids: [],
	random_tag_count: [],
	state_ids: [],
	district_ids: [],
	tag_ids: [],
	marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
	marks_level: 'question',
	shuffle: false,
	show_result: true,
	show_question_palette: true,
	show_feedback_on_completion: false,
	show_feedback_immediately: false,
	locale: 'en-US',
	omr: 'NEVER',
	certificate_id: null,
	template_id: null,
	link: null,
	start_time: null,
	end_time: null,
	time_limit: null,
	marks: null,
	completion_message: null,
	start_instructions: null,
	question_pagination: 0,
	no_of_attempts: 1
};

let mockSubmit: ReturnType<typeof vi.fn>;

/** Set up the superForm mock and return the writable store for inspection. */
function setupSuperFormMock(overrides: Partial<typeof defaultFormValues> = {}) {
	const formStore = writable({ ...defaultFormValues, ...overrides });
	mockSubmit = vi.fn();
	vi.mocked(superForm).mockReturnValue({
		form: formStore,
		enhance: vi.fn(() => ({ destroy: vi.fn() })),
		submit: mockSubmit
	} as any);
	return formStore;
}

function baseData(overrides: Record<string, any> = {}) {
	return {
		form: {},
		testData: null,
		questions: { items: [], total: 0, pages: 0 },
		selectedQuestions: [],
		questionParams: {
			questionPage: 1,
			questionSize: 25,
			questionSearch: '',
			questionTags: '',
			questionStates: '',
			questionSortBy: '',
			questionSortOrder: 'asc'
		},
		user: { id: 1, permissions: [] },
		test_taker_url: 'http://test-taker.example.com',
		...overrides
	};
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Test Create/Update Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupSuperFormMock();
	});

	// ── Step header ───────────────────────────────────────────────────────────

	describe('Step header', () => {
		it('renders Primary Details step label', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Primary Details')).toBeInTheDocument();
		});

		it('renders Select Questions step label', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Select Questions')).toBeInTheDocument();
		});

		it('renders Configuration Settings step label', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Configuration Settings')).toBeInTheDocument();
		});

		it('renders abbreviated step labels for small screens', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Details')).toBeInTheDocument();
			expect(screen.getByText('Questions')).toBeInTheDocument();
			expect(screen.getByText('Config')).toBeInTheDocument();
		});
	});

	// ── Footer action buttons ─────────────────────────────────────────────────

	describe('Footer action buttons', () => {
		it('shows Cancel button', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Cancel')).toBeInTheDocument();
		});

		it('shows Continue button on step 1', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Continue')).toBeInTheDocument();
		});

		it('shows Continue button on step 2 after advancing', async () => {
			setupSuperFormMock({ name: 'My Test', description: 'My Description' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(screen.getByText('Continue'));

			expect(screen.getByText('Continue')).toBeInTheDocument();
		});

		it('shows Save button on step 3 after advancing twice', async () => {
			setupSuperFormMock({ name: 'My Test', description: 'My Description' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(screen.getByText('Continue'));
			await fireEvent.click(screen.getByText('Continue'));

			expect(screen.getByText('Save')).toBeInTheDocument();
		});

		it('does not show Save button initially (step 1)', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.queryByText('Save')).not.toBeInTheDocument();
		});
	});

	// ── Continue button disabled state ────────────────────────────────────────

	describe('Continue button — disabled state on step 1', () => {
		it('is disabled when name is empty', () => {
			setupSuperFormMock({ name: '', description: 'Some description' });
			render(TestCreatePage, { data: baseData() });

			const btn = screen.getByText('Continue').closest('button');
			expect(btn).toBeDisabled();
		});

		it('is disabled when description is empty', () => {
			setupSuperFormMock({ name: 'Some name', description: '' });
			render(TestCreatePage, { data: baseData() });

			const btn = screen.getByText('Continue').closest('button');
			expect(btn).toBeDisabled();
		});

		it('is disabled when both name and description are empty', () => {
			setupSuperFormMock({ name: '', description: '' });
			render(TestCreatePage, { data: baseData() });

			const btn = screen.getByText('Continue').closest('button');
			expect(btn).toBeDisabled();
		});

		it('is disabled when name is only whitespace', () => {
			setupSuperFormMock({ name: '   ', description: 'Valid description' });
			render(TestCreatePage, { data: baseData() });

			const btn = screen.getByText('Continue').closest('button');
			expect(btn).toBeDisabled();
		});

		it('is enabled when name and description are both filled', () => {
			setupSuperFormMock({ name: 'Test Name', description: 'Test Description' });
			render(TestCreatePage, { data: baseData() });

			const btn = screen.getByText('Continue').closest('button');
			expect(btn).not.toBeDisabled();
		});
	});

	// ── Continue button disabled — cross-screen condition ────────────────────

	describe('Continue button — disabled when random questions exceed selected', () => {
		it('is disabled on step 1 when no_of_random_questions > question_revision_ids count', () => {
			setupSuperFormMock({
				name: 'Test Name',
				description: 'Test Desc',
				no_of_random_questions: 5,
				question_revision_ids: [1, 2]
			});
			render(TestCreatePage, { data: baseData() });

			const btn = screen.getByText('Continue').closest('button');
			expect(btn).toBeDisabled();
		});

		it('is enabled when no_of_random_questions equals question_revision_ids count', () => {
			setupSuperFormMock({
				name: 'Test Name',
				description: 'Test Desc',
				no_of_random_questions: 2,
				question_revision_ids: [1, 2]
			});
			render(TestCreatePage, { data: baseData() });

			const btn = screen.getByText('Continue').closest('button');
			expect(btn).not.toBeDisabled();
		});

		it('is enabled when no_of_random_questions is 0 and no questions selected', () => {
			setupSuperFormMock({
				name: 'Test Name',
				description: 'Test Desc',
				no_of_random_questions: 0,
				question_revision_ids: []
			});
			render(TestCreatePage, { data: baseData() });

			const btn = screen.getByText('Continue').closest('button');
			expect(btn).not.toBeDisabled();
		});
	});

	// ── Step navigation ───────────────────────────────────────────────────────

	describe('Step navigation', () => {
		it('advances to step 2 when Continue is clicked on step 1', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(screen.getByText('Continue'));

			// Still shows Continue (not Save), confirming we are on step 2
			expect(screen.getByText('Continue')).toBeInTheDocument();
			expect(screen.queryByText('Save')).not.toBeInTheDocument();
		});

		it('advances to step 3 when Continue is clicked on step 2', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(screen.getByText('Continue'));
			await fireEvent.click(screen.getByText('Continue'));

			// Now on step 3 — button shows Save
			expect(screen.getByText('Save')).toBeInTheDocument();
			expect(screen.queryByText('Continue')).not.toBeInTheDocument();
		});

		it('does not advance from step 1 when Continue is disabled', async () => {
			setupSuperFormMock({ name: '', description: '' });
			render(TestCreatePage, { data: baseData() });

			// Button is disabled — clicking should not advance
			const btn = screen.getByText('Continue').closest('button')!;
			await fireEvent.click(btn);

			// Still on step 1: Continue visible, Save not visible
			expect(screen.getByText('Continue')).toBeInTheDocument();
			expect(screen.queryByText('Save')).not.toBeInTheDocument();
		});
	});

	// ── Form submission ───────────────────────────────────────────────────────

	describe('Form submission', () => {
		it('calls submit() when Save is clicked on step 3', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(screen.getByText('Continue'));
			await fireEvent.click(screen.getByText('Continue'));
			await fireEvent.click(screen.getByText('Save'));

			expect(mockSubmit).toHaveBeenCalledOnce();
		});

		it('does not call submit() when Continue is clicked on step 1', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(screen.getByText('Continue'));

			expect(mockSubmit).not.toHaveBeenCalled();
		});

		it('does not call submit() when Continue is clicked on step 2', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(screen.getByText('Continue'));
			await fireEvent.click(screen.getByText('Continue'));

			expect(mockSubmit).not.toHaveBeenCalled();
		});

		it('form has method=POST and action=?/save', () => {
			render(TestCreatePage, { data: baseData() });

			const form = document.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
			expect(form).toHaveAttribute('action', '?/save');
		});
	});

	// ── superForm initialisation ──────────────────────────────────────────────

	describe('superForm initialisation', () => {
		it('passes testData to superForm when testData is present', () => {
			const testData = {
				id: '42',
				name: 'Existing Test',
				description: 'Existing Description',
				question_revisions: [],
				states: [],
				districts: [],
				tags: [],
				random_tag_counts: []
			};
			render(TestCreatePage, { data: baseData({ testData }) });

			expect(superForm).toHaveBeenCalledWith(testData, expect.any(Object));
		});

		it('passes form data to superForm when testData is null', () => {
			const formData = { name: '', description: '', is_template: false };
			render(TestCreatePage, { data: baseData({ testData: null, form: formData }) });

			expect(superForm).toHaveBeenCalledWith(formData, expect.any(Object));
		});

		it('passes dataType: json option to superForm', () => {
			render(TestCreatePage, { data: baseData() });

			expect(superForm).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ dataType: 'json' })
			);
		});

		it('passes applyAction: never option to superForm', () => {
			render(TestCreatePage, { data: baseData() });

			expect(superForm).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ applyAction: 'never' })
			);
		});
	});
});
