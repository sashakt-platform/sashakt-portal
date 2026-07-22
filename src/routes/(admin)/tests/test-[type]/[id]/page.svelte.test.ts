import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { get, writable } from 'svelte/store';
import TestCreatePage from './+page.svelte';
import { superForm } from 'sveltekit-superforms';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/tests/test-session/convert?template_id=99')
	}
}));

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

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultFormValues = {
	name: '',
	description: '',
	is_template: false,
	is_active: true,
	random_questions: false,
	no_of_random_questions: 0,
	question_revision_ids: [],
	question_sets: [],
	random_tag_count: [],
	state_ids: [],
	district_ids: [],
	tag_ids: [],
	tag_type_ids: [],
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
	no_of_attempts: 1,
	bookmark: false,
	pause_timer_when_inactive: false,
	form_id: null
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function baseData(overrides: Record<string, any> = {}): any {
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
		orgSettings: null,
		templates: { items: [], total: 0, pages: 0 },
		templateParams: {},
		convertTemplate: false,
		...overrides
	};
}

/** Get the bottom navigation Next/Save button (the last one in the DOM). */
function getBottomNextButton() {
	const buttons = screen.getAllByText(/^(Next|Save|Save & Continue|Cancel)$/);
	return buttons[buttons.length - 1].closest('button')!;
}

function completePrimaryStep(message?: Record<string, unknown>) {
	const options = vi.mocked(superForm).mock.calls.at(-1)?.[1] as {
		onUpdated: (event: { form: { valid: boolean; message?: Record<string, unknown> } }) => void;
	};
	// onUpdated mutates $state (currentScreen) outside of any Svelte event handler,
	// so flush synchronously to guarantee the DOM reflects the new screen immediately.
	flushSync(() => options.onUpdated({ form: { valid: true, message } }));
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Test Create/Update Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupSuperFormMock();
		resetNomenclature();
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

		it('renders Test Configuration step label', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Test Configuration')).toBeInTheDocument();
		});
	});

	// ── Navigation buttons ───────────────────────────────────────────────────

	describe('Navigation buttons', () => {
		it('shows Previous buttons (disabled on step 1)', () => {
			render(TestCreatePage, { data: baseData() });
			const buttons = screen.getAllByText('Previous');
			expect(buttons.length).toBeGreaterThanOrEqual(2);
			buttons.forEach((btn) => {
				expect(btn.closest('button')).toBeDisabled();
			});
		});

		it('shows Save & Continue button on step 1', () => {
			render(TestCreatePage, { data: baseData() });
			const buttons = screen.getAllByText('Save & Continue');
			expect(buttons.length).toBeGreaterThanOrEqual(2);
		});

		it('shows Save & Continue button on step 2 after advancing', async () => {
			setupSuperFormMock({ name: 'My Test', description: 'My Description' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });

			expect(screen.getAllByText('Save & Continue').length).toBeGreaterThanOrEqual(2);
		});

		it('shows Save button on step 3 after advancing twice', async () => {
			setupSuperFormMock({ name: 'My Test', description: 'My Description' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });
			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();

			expect(screen.getAllByText('Save').length).toBeGreaterThanOrEqual(2);
		});

		it('does not show Save button initially (step 1)', () => {
			render(TestCreatePage, { data: baseData() });
			expect(screen.queryByText('Save')).not.toBeInTheDocument();
		});
	});

	// ── Next button disabled state ───────────────────────────────────────────

	describe('Next button — disabled state on step 1', () => {
		it('is disabled when name is empty', () => {
			setupSuperFormMock({ name: '', description: 'Some description' });
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).toBeDisabled();
		});

		it('is not disabled when description is empty', () => {
			setupSuperFormMock({ name: 'Some name', description: '' });
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).not.toBeDisabled();
		});

		it('is disabled when both name and description are empty', () => {
			setupSuperFormMock({ name: '', description: '' });
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).toBeDisabled();
		});

		it('is disabled when name is only whitespace', () => {
			setupSuperFormMock({ name: '   ', description: 'Valid description' });
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).toBeDisabled();
		});

		it('is enabled when name and description are both filled', () => {
			setupSuperFormMock({ name: 'Test Name', description: 'Test Description' });
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).not.toBeDisabled();
		});
	});

	// ── Next button disabled — cross-screen condition ────────────────────────

	describe('Next button — disabled when random questions exceed selected', () => {
		it('is not disabled on step 1 when no_of_random_questions > question_revision_ids count (check only applies on Configuration step)', () => {
			setupSuperFormMock({
				name: 'Test Name',
				description: 'Test Desc',
				no_of_random_questions: 5,
				question_revision_ids: [1, 2] as any
			});
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).not.toBeDisabled();
		});

		it('is enabled when no_of_random_questions equals question_revision_ids count', () => {
			setupSuperFormMock({
				name: 'Test Name',
				description: 'Test Desc',
				no_of_random_questions: 2,
				question_revision_ids: [1, 2] as any
			});
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).not.toBeDisabled();
		});

		it('is enabled when no_of_random_questions is 0 and no questions selected', () => {
			setupSuperFormMock({
				name: 'Test Name',
				description: 'Test Desc',
				no_of_random_questions: 0,
				question_revision_ids: []
			});
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).not.toBeDisabled();
		});
	});

	// ── Step navigation ───────────────────────────────────────────────────────

	describe('Step navigation', () => {
		it('advances to step 2 when Next is clicked on step 1', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());

			// Still shows Save & Continue (not Save), confirming we are on step 2
			expect(screen.getAllByText('Save & Continue').length).toBeGreaterThanOrEqual(2);
			expect(screen.queryByText('Save')).not.toBeInTheDocument();
		});

		it('advances to step 3 when Next is clicked on step 2', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });
			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();

			// Now on step 3 — button shows Save
			expect(screen.getAllByText('Save').length).toBeGreaterThanOrEqual(2);
			expect(screen.queryByText('Next')).not.toBeInTheDocument();
		});

		it('does not advance from step 1 when Next is disabled', async () => {
			setupSuperFormMock({ name: '', description: '' });
			render(TestCreatePage, { data: baseData() });

			// Button is disabled — clicking should not advance
			await fireEvent.click(getBottomNextButton());

			// Still on step 1: Save & Continue visible, Save not visible
			expect(screen.getAllByText('Save & Continue').length).toBeGreaterThanOrEqual(2);
			expect(screen.queryByText('Save')).not.toBeInTheDocument();
		});
	});

	// ── Form submission ───────────────────────────────────────────────────────

	describe('Form submission', () => {
		it('calls submit() when Save is clicked on step 3', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });
			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton());

			expect(mockSubmit).toHaveBeenCalledOnce();
		});

		it('does not call submit() when Next is clicked on step 1', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());

			expect(mockSubmit).not.toHaveBeenCalled();
		});

		it('does not call submit() when Next is clicked on step 2', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });
			await fireEvent.click(getBottomNextButton());

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

		it('maps backend question_sets into form state for sectioned tests', () => {
			const formStore = setupSuperFormMock();
			const testData = {
				id: '42',
				name: 'Existing Test',
				description: 'Existing Description',
				question_revisions: [{ id: 101 }],
				question_sets: [
					{
						id: 10,
						title: 'Physics',
						description: 'Mechanics',
						display_order: 1,
						max_questions_allowed_to_attempt: 1,
						marking_scheme: { correct: 4, wrong: -1, skipped: 0 },
						question_revisions: [{ id: 101, question_text: 'What is force?', tags: [] }]
					}
				],
				states: [],
				districts: [],
				tags: [],
				random_tag_counts: []
			};

			render(TestCreatePage, { data: baseData({ testData }) });

			expect(get(formStore).question_sets).toEqual([
				expect.objectContaining({
					id: 10,
					title: 'Physics',
					question_revision_ids: [101]
				})
			]);
		});
	});

	// ── Full happy-path flow ──────────────────────────────────────────────────

	describe('full happy-path flow — name + tags + manual questions → save', () => {
		it('saves successfully when name, tags and manual questions are all set', async () => {
			// Cast to any: tag_ids/question_revision_ids are inferred as never[] in defaultFormValues
			setupSuperFormMock({
				name: 'Governance Assessment',
				description: 'Test description',
				tag_ids: [{ id: '10', name: 'Science' }] as any,
				question_revision_ids: [101, 102, 103] as any
			});
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton()); // step 1 → step 2
			completePrimaryStep({ redirectId: 42 });
			await fireEvent.click(getBottomNextButton()); // step 2 → step 3
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton()); // Save

			expect(mockSubmit).toHaveBeenCalledOnce();
		});

		it('form store contains tags and question IDs when Save is triggered', async () => {
			const formStore = setupSuperFormMock({
				name: 'Governance Assessment',
				tag_ids: [
					{ id: '10', name: 'Science' },
					{ id: '11', name: 'Maths' }
				] as any,
				question_revision_ids: [101, 102] as any
			});
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton()); // step 1 → step 2
			completePrimaryStep({ redirectId: 42 });
			await fireEvent.click(getBottomNextButton()); // step 2 → step 3
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton()); // Save

			const stored = get(formStore);
			expect(stored.tag_ids).toEqual([
				{ id: '10', name: 'Science' },
				{ id: '11', name: 'Maths' }
			]);
			expect(stored.question_revision_ids).toEqual([101, 102]);
			expect(mockSubmit).toHaveBeenCalledOnce();
		});

		it('Next is enabled on step 1 when name and tags are set', () => {
			setupSuperFormMock({
				name: 'My Test',
				tag_ids: [{ id: '5', name: 'History' }] as any
			});
			render(TestCreatePage, { data: baseData() });

			expect(getBottomNextButton()).not.toBeDisabled();
		});

		it('Next is not disabled on step 2 when manual questions are selected', async () => {
			setupSuperFormMock({
				name: 'My Test',
				tag_ids: [{ id: '5', name: 'History' }] as any,
				question_revision_ids: [201, 202] as any
			});
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton()); // step 1 → step 2

			expect(getBottomNextButton()).not.toBeDisabled();
		});
	});

	// ── Edit mode — no changes ────────────────────────────────────────────────

	describe('edit mode — existing test with tags and questions, no changes', () => {
		function makeTestData(overrides: Record<string, any> = {}) {
			return {
				id: '42',
				name: 'Existing Governance Test',
				description: 'An existing test description',
				question_revisions: [{ id: 101 }, { id: 102 }, { id: 103 }],
				question_sets: [],
				states: [],
				districts: [],
				tags: [
					{ id: '10', name: 'Science' },
					{ id: '11', name: 'Maths' }
				],
				random_tag_counts: [],
				...overrides
			};
		}

		it('can navigate through all steps and save without making any changes', async () => {
			// populateFormFromTestData will write name/tags/question_ids into the store
			setupSuperFormMock();
			render(TestCreatePage, { data: baseData({ testData: makeTestData() }) });

			await fireEvent.click(getBottomNextButton()); // step 1 → step 2 (PUT, no redirect)
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton()); // step 2 → step 3
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton()); // Save

			expect(mockSubmit).toHaveBeenCalledOnce();
		});

		it('initialises superForm with testData (not the blank form)', () => {
			setupSuperFormMock();
			const testData = makeTestData();
			render(TestCreatePage, { data: baseData({ testData }) });

			expect(superForm).toHaveBeenCalledWith(testData, expect.any(Object));
		});

		it('populates tag_ids and question_revision_ids from testData into the form store', () => {
			const formStore = setupSuperFormMock();
			render(TestCreatePage, { data: baseData({ testData: makeTestData() }) });

			const stored = get(formStore);
			expect(stored.tag_ids).toEqual([
				{ id: '10', name: 'Science' },
				{ id: '11', name: 'Maths' }
			]);
			expect(stored.question_revision_ids).toEqual([101, 102, 103]);
		});

		it('Next button is enabled on step 1 because testData has a non-empty name', () => {
			setupSuperFormMock();
			render(TestCreatePage, { data: baseData({ testData: makeTestData() }) });

			expect(getBottomNextButton()).not.toBeDisabled();
		});

		it('Next button is enabled on step 2 because existing questions satisfy the count', async () => {
			setupSuperFormMock();
			render(TestCreatePage, { data: baseData({ testData: makeTestData() }) });

			await fireEvent.click(getBottomNextButton()); // step 1 → step 2

			expect(getBottomNextButton()).not.toBeDisabled();
		});
	});

	// ── tag_type_ids population ───────────────────────────────────────────────

	describe('populateFormFromTestData — tag_type_ids', () => {
		it('derives tag_type_ids from tags with nested tag_type objects', () => {
			const formStore = setupSuperFormMock();
			const testData = {
				id: '42',
				name: 'Test',
				description: '',
				question_revisions: [],
				question_sets: [],
				states: [],
				districts: [],
				tags: [
					{ id: '1', name: 'Physics', tag_type: { id: '10', name: 'Subject' } },
					{ id: '2', name: 'Algebra', tag_type: { id: '20', name: 'Topic' } }
				],
				random_tag_counts: []
			};
			render(TestCreatePage, { data: baseData({ testData }) });

			const stored = get(formStore);
			expect(stored.tag_type_ids).toEqual([
				{ id: '10', name: 'Subject' },
				{ id: '20', name: 'Topic' }
			]);
		});

		it('deduplicates tag_type_ids when multiple tags share the same tag_type', () => {
			const formStore = setupSuperFormMock();
			const testData = {
				id: '42',
				name: 'Test',
				description: '',
				question_revisions: [],
				question_sets: [],
				states: [],
				districts: [],
				tags: [
					{ id: '1', name: 'Physics', tag_type: { id: '10', name: 'Subject' } },
					{ id: '2', name: 'Chemistry', tag_type: { id: '10', name: 'Subject' } }
				],
				random_tag_counts: []
			};
			render(TestCreatePage, { data: baseData({ testData }) });

			const stored = get(formStore);
			expect(stored.tag_type_ids).toHaveLength(1);
			expect(stored.tag_type_ids).toEqual([{ id: '10', name: 'Subject' }]);
		});

		it('produces empty tag_type_ids when tags have no tag_type field', () => {
			const formStore = setupSuperFormMock();
			const testData = {
				id: '42',
				name: 'Test',
				description: '',
				question_revisions: [],
				question_sets: [],
				states: [],
				districts: [],
				tags: [
					{ id: '1', name: 'Physics' },
					{ id: '2', name: 'Algebra' }
				],
				random_tag_counts: []
			};
			render(TestCreatePage, { data: baseData({ testData }) });

			expect(get(formStore).tag_type_ids).toEqual([]);
		});

		it('produces empty tag_type_ids when tags array is empty', () => {
			const formStore = setupSuperFormMock();
			const testData = {
				id: '42',
				name: 'Test',
				description: '',
				question_revisions: [],
				question_sets: [],
				states: [],
				districts: [],
				tags: [],
				random_tag_counts: []
			};
			render(TestCreatePage, { data: baseData({ testData }) });

			expect(get(formStore).tag_type_ids).toEqual([]);
		});

		it('defaults tag_type_ids to empty array for a new test (no testData)', () => {
			const formStore = setupSuperFormMock();
			render(TestCreatePage, { data: baseData({ testData: null }) });

			expect(get(formStore).tag_type_ids).toEqual([]);
		});

		it('tag_type_ids persists in the form store after navigating to step 2 and back', async () => {
			const formStore = setupSuperFormMock({ name: 'Test', description: 'Desc' });
			const testData = {
				id: '42',
				name: 'Test',
				description: 'Desc',
				question_revisions: [],
				question_sets: [],
				states: [],
				districts: [],
				tags: [{ id: '1', name: 'Physics', tag_type: { id: '10', name: 'Subject' } }],
				random_tag_counts: []
			};
			render(TestCreatePage, { data: baseData({ testData }) });

			// tag_type_ids set from testData
			expect(get(formStore).tag_type_ids).toEqual([{ id: '10', name: 'Subject' }]);

			await fireEvent.click(getBottomNextButton()); // step 1 → step 2

			// Still intact in the store on step 2
			expect(get(formStore).tag_type_ids).toEqual([{ id: '10', name: 'Subject' }]);

			const prevButtons = screen.getAllByText('Previous');
			await fireEvent.click(prevButtons[prevButtons.length - 1]); // step 2 → step 1

			// Still intact after returning to step 1
			expect(get(formStore).tag_type_ids).toEqual([{ id: '10', name: 'Subject' }]);
		});
	});

	// ── Custom nomenclature labels ───────────────────────────────────────────

	describe('Custom nomenclature labels', () => {
		it('renders custom heading for session mode when test is overridden', () => {
			setCustomNomenclature({ test: 'Exam' });
			setupSuperFormMock();
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Create Exam')).toBeInTheDocument();
			expect(screen.queryByText('Create Test')).not.toBeInTheDocument();
		});

		it('renders custom heading for template mode when test_template is overridden', () => {
			setCustomNomenclature({ test_template: 'Exam Blueprint' });
			setupSuperFormMock({ is_template: true });
			render(TestCreatePage, { data: baseData({ convertTemplate: false }) });
			expect(screen.getByText('Create Exam Blueprint')).toBeInTheDocument();
		});

		it('renders custom step label for test configuration when test is overridden', () => {
			setCustomNomenclature({ test: 'Assessment' });
			setupSuperFormMock();
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Assessment Configuration')).toBeInTheDocument();
			expect(screen.queryByText('Test Configuration')).not.toBeInTheDocument();
		});

		it('renders custom edit heading when test is overridden and testData is present', () => {
			setCustomNomenclature({ test: 'Quiz' });
			setupSuperFormMock();
			const testData = {
				id: '42',
				name: 'Existing',
				description: '',
				question_revisions: [],
				question_sets: [],
				states: [],
				districts: [],
				tags: [],
				random_tag_counts: []
			};
			render(TestCreatePage, { data: baseData({ testData }) });
			expect(screen.getByText('Edit Quiz')).toBeInTheDocument();
		});

		it('renders custom select template step label when test_template is overridden', () => {
			setCustomNomenclature({ test_template: 'Exam Blueprint' });
			setupSuperFormMock();
			render(TestCreatePage, { data: baseData({ convertTemplate: true }) });
			expect(screen.getByText('Select Exam Blueprint')).toBeInTheDocument();
		});

		it('falls back to defaults when no custom nomenclature is set', () => {
			setupSuperFormMock();
			render(TestCreatePage, { data: baseData() });
			expect(screen.getByText('Create Test')).toBeInTheDocument();
			expect(screen.getByText('Test Configuration')).toBeInTheDocument();
		});
	});

	// ── Convert-from-template flow ───────────────────────────────────────────

	describe('Convert-from-template flow', () => {
		function makeTemplateTestData(overrides: Record<string, any> = {}) {
			return {
				id: '99',
				name: 'Governance Template',
				description: 'A template description',
				is_active: true,
				start_time: null,
				end_time: null,
				pause_timer_when_inactive: true,
				time_limit: 45,
				marks_level: 'test',
				marks: 10,
				marking_scheme: { correct: 2, wrong: -0.5, skipped: 0 },
				completion_message: 'Thanks for completing the template test.',
				start_instructions: 'Please read carefully before starting.',
				no_of_attempts: 3,
				shuffle: false,
				random_questions: false,
				no_of_random_questions: null,
				question_pagination: 5,
				show_result: false,
				show_question_palette: false,
				bookmark: true,
				locale: 'en-US',
				certificate_id: 7,
				show_feedback_on_completion: true,
				show_feedback_immediately: true,
				form_id: 3,
				omr: 'ALWAYS',
				template_id: '99',
				link: null,
				question_revisions: [],
				question_sets: [],
				states: [],
				districts: [],
				tags: [],
				random_tag_counts: [],
				...overrides
			};
		}

		// Scenario 2: step label reflects that questions are being reviewed, not chosen
		it('shows the "Review Questions" step label once template data has loaded', () => {
			setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ convertTemplate: true, testData: makeTemplateTestData() })
			});

			expect(screen.getByText('Review Questions')).toBeInTheDocument();
			expect(screen.queryByText('Select Questions')).not.toBeInTheDocument();
		});

		it('still shows "Select Questions" for a normal (non-template) test', () => {
			setupSuperFormMock();
			render(TestCreatePage, { data: baseData() });

			expect(screen.getByText('Select Questions')).toBeInTheDocument();
			expect(screen.queryByText('Review Questions')).not.toBeInTheDocument();
		});

		// Scenario 3: Configuration-page fields are populated from the selected template
		it('copies template configuration fields (pre/post-test messages etc.) into the form store', () => {
			const formStore = setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ convertTemplate: true, testData: makeTemplateTestData() })
			});

			const stored = get(formStore);
			expect(stored.start_instructions).toBe('Please read carefully before starting.');
			expect(stored.completion_message).toBe('Thanks for completing the template test.');
			expect(stored.time_limit).toBe(45);
			expect(stored.marks_level).toBe('test');
			expect(stored.marking_scheme).toEqual({ correct: 2, wrong: -0.5, skipped: 0 });
			expect(stored.no_of_attempts).toBe(3);
			expect(stored.certificate_id).toBe(7);
			expect(stored.omr).toBe('ALWAYS');
			expect(stored.show_feedback_on_completion).toBe(true);
			expect(stored.show_feedback_immediately).toBe(true);
			expect(stored.bookmark).toBe(true);
			expect(stored.pause_timer_when_inactive).toBe(true);
		});

		// Scenario 1: going back to the template-select step must re-fetch the template list
		describe('navigating back to the template-select step', () => {
			it('clears template_id from the URL so the server re-fetches the template list', async () => {
				setupSuperFormMock();
				render(TestCreatePage, {
					data: baseData({ convertTemplate: true, testData: makeTemplateTestData() })
				});

				// The effect auto-advances us to step 2 (Review Questions) once template data loads.
				expect(screen.getByText('Review Questions')).toBeInTheDocument();

				const prevButtons = screen.getAllByText('Previous');
				await fireEvent.click(prevButtons[prevButtons.length - 1]);

				expect(goto).toHaveBeenCalledWith('/tests/test-session/convert', {
					invalidateAll: true
				});
			});

			it('returns to the template-select step (Previous becomes disabled again)', async () => {
				setupSuperFormMock();
				render(TestCreatePage, {
					data: baseData({ convertTemplate: true, testData: makeTemplateTestData() })
				});

				const prevButtons = screen.getAllByText('Previous');
				await fireEvent.click(prevButtons[prevButtons.length - 1]);

				const buttonsAfter = screen.getAllByText('Previous');
				buttonsAfter.forEach((btn) => {
					expect(btn.closest('button')).toBeDisabled();
				});
			});

			it('also clears template_id when the "Select Test template" stepper label is clicked directly', async () => {
				setupSuperFormMock();
				render(TestCreatePage, {
					data: baseData({ convertTemplate: true, testData: makeTemplateTestData() })
				});

				// Clicking the completed step-1 label (not the Previous button) should behave
				// the same way: it's a separate code path that bypassed the fix initially.
				await fireEvent.click(screen.getByText('Select Test Template'));

				expect(goto).toHaveBeenCalledWith('/tests/test-session/convert', {
					invalidateAll: true
				});
				const prevButtons = screen.getAllByText('Previous');
				prevButtons.forEach((btn) => {
					expect(btn.closest('button')).toBeDisabled();
				});
			});
		});
	});

	// ── Screen navigation via ?step= URL param ───────────────────────────────

	describe('Screen navigation via ?step= URL param', () => {
		afterEach(() => {
			page.url.searchParams.delete('step');
		});

		it('opens directly on the questions screen when ?step=questions is present', () => {
			page.url.searchParams.set('step', 'questions');
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			const prevButtons = screen.getAllByText('Previous');
			prevButtons.forEach((btn) => expect(btn.closest('button')).not.toBeDisabled());
			expect(screen.queryByText('Save')).not.toBeInTheDocument();
		});

		it('opens directly on the configuration screen when ?step=configuration is present', () => {
			page.url.searchParams.set('step', 'configuration');
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			expect(screen.getAllByText('Save').length).toBeGreaterThanOrEqual(2);
		});

		it('falls back to the primary screen when the step param is absent', () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			const prevButtons = screen.getAllByText('Previous');
			prevButtons.forEach((btn) => expect(btn.closest('button')).toBeDisabled());
		});

		it('falls back to the primary screen when the step param has an unrecognised value', () => {
			page.url.searchParams.set('step', 'not-a-real-step');
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			const prevButtons = screen.getAllByText('Previous');
			prevButtons.forEach((btn) => expect(btn.closest('button')).toBeDisabled());
		});

		it('updates the URL with ?step=questions after successfully saving the primary step', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });

			expect(goto).toHaveBeenCalledWith(
				expect.stringContaining('step=questions'),
				expect.objectContaining({ replaceState: true, invalidateAll: true })
			);
		});

		it('rewrites the URL path to the new test id when redirectId is returned from the primary save', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });

			expect(goto).toHaveBeenCalledWith(
				expect.stringMatching(/^\/tests\/test-session\/42\?/),
				expect.anything()
			);
		});

		it('updates the URL with ?step=configuration after successfully saving the questions step', async () => {
			setupSuperFormMock({ name: 'Test', description: 'Desc' });
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });
			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();

			expect(goto).toHaveBeenCalledWith(
				expect.stringContaining('step=configuration'),
				expect.objectContaining({ replaceState: true })
			);
		});
	});

	// ── handlePrevious — filters incomplete random_tag_count rows ────────────

	describe('handlePrevious — filters incomplete random_tag_count rows', () => {
		it('removes random_tag_count entries with an undefined count when leaving the questions step', async () => {
			const formStore = setupSuperFormMock({
				name: 'Test',
				description: 'Desc',
				random_tag_count: [
					{ id: '1', name: 'Science', count: 3 },
					{ id: '2', name: 'Maths', count: undefined }
				] as any
			});
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });

			const prevButtons = screen.getAllByText('Previous');
			await fireEvent.click(prevButtons[prevButtons.length - 1]);

			expect(get(formStore).random_tag_count).toEqual([{ id: '1', name: 'Science', count: 3 }]);
		});

		it('leaves random_tag_count untouched when going back from the primary step (no-op)', async () => {
			const formStore = setupSuperFormMock({
				name: 'Test',
				description: 'Desc',
				random_tag_count: [{ id: '1', name: 'Science', count: undefined }] as any
			});
			render(TestCreatePage, { data: baseData() });

			const prevButtons = screen.getAllByText('Previous');
			await fireEvent.click(prevButtons[prevButtons.length - 1]);

			expect(get(formStore).random_tag_count).toEqual([
				{ id: '1', name: 'Science', count: undefined }
			]);
		});

		it('keeps random_tag_count entries that already have a count when leaving the questions step', async () => {
			const formStore = setupSuperFormMock({
				name: 'Test',
				description: 'Desc',
				random_tag_count: [
					{ id: '1', name: 'Science', count: 2 },
					{ id: '2', name: 'Maths', count: 0 }
				] as any
			});
			render(TestCreatePage, { data: baseData() });

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep({ redirectId: 42 });

			const prevButtons = screen.getAllByText('Previous');
			await fireEvent.click(prevButtons[prevButtons.length - 1]);

			expect(get(formStore).random_tag_count).toEqual([
				{ id: '1', name: 'Science', count: 2 },
				{ id: '2', name: 'Maths', count: 0 }
			]);
		});
	});

	// ── Test lock — testLocked banner and controls ───────────────────────────

	describe('Test lock — testLocked banner and controls', () => {
		function makeTestData(overrides: Record<string, any> = {}) {
			return {
				id: '42',
				name: 'Existing Test',
				description: 'An existing description',
				question_revisions: [],
				question_sets: [],
				states: [],
				districts: [],
				tags: [],
				random_tag_counts: [],
				...overrides
			};
		}

		const lockedBannerText = /not editable because candidates have already attempted it/;

		it('does not show the locked banner on the primary step even when the test is locked', () => {
			setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			expect(screen.queryByText(lockedBannerText)).not.toBeInTheDocument();
		});

		it('shows the locked banner on the questions step when the test is locked', async () => {
			setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			await fireEvent.click(getBottomNextButton()); // step 1 -> step 2
			completePrimaryStep();

			expect(screen.getByText(lockedBannerText)).toBeInTheDocument();
		});

		it('does not show the locked banner when the test is not locked', async () => {
			setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: false })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();

			expect(screen.queryByText(lockedBannerText)).not.toBeInTheDocument();
		});

		it('shows "Next" instead of "Save & Continue" on the questions step when locked', async () => {
			setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();

			expect(screen.getAllByText('Next').length).toBeGreaterThanOrEqual(2);
			expect(screen.queryByText('Save & Continue')).not.toBeInTheDocument();
		});

		it('shows "Cancel" instead of "Save" on the configuration step when locked', async () => {
			setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton());

			expect(screen.getAllByText('Cancel').length).toBeGreaterThanOrEqual(2);
			expect(screen.queryByText('Save')).not.toBeInTheDocument();
		});

		it('navigates back to the listing page when Cancel is clicked on a locked test', async () => {
			setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton());
			await fireEvent.click(getBottomNextButton());

			expect(goto).toHaveBeenCalledWith(expect.stringContaining('/tests/test-session/'));
			expect(mockSubmit).not.toHaveBeenCalled();
		});

		it('does not submit the form when advancing past a locked questions step', async () => {
			setupSuperFormMock();
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton());

			expect(mockSubmit).not.toHaveBeenCalled();
		});

		it('bypasses the random-tag-count validation on the questions step when locked', async () => {
			setupSuperFormMock({
				random_tag_count: [{ id: '1', name: 'Science', count: undefined }] as any
			});
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();

			expect(getBottomNextButton()).not.toBeDisabled();
		});

		it('bypasses the random-questions-count validation on the configuration step when locked', async () => {
			setupSuperFormMock({
				random_questions: true,
				no_of_random_questions: 0
			});
			render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();
			await fireEvent.click(getBottomNextButton());

			expect(getBottomNextButton()).not.toBeDisabled();
		});

		it('wraps QuestionList in a disabled fieldset when locked', async () => {
			setupSuperFormMock();
			const { container } = render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: true })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();

			expect(container.querySelector('fieldset[disabled]')).not.toBeNull();
		});

		it('does not disable the QuestionList fieldset when not locked', async () => {
			setupSuperFormMock();
			const { container } = render(TestCreatePage, {
				data: baseData({ testData: makeTestData(), isTestLocked: false })
			});

			await fireEvent.click(getBottomNextButton());
			completePrimaryStep();

			expect(container.querySelector('fieldset[disabled]')).toBeNull();
		});
	});
});
