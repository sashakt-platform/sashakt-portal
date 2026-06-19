import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import OrganizationSettingsForm from './OrganizationSettingsForm.svelte';
import { fillMissingNomenclatureKeys } from './schema';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/navigation', () => ({
	invalidateAll: vi.fn()
}));

vi.mock('$lib/nomenclature', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/nomenclature')>();
	return {
		...actual,
		useTerms: () => (key: string) => actual.NOMENCLATURE_DEFAULTS[key as keyof typeof actual.NOMENCLATURE_DEFAULTS] ?? key
	};
});

function storeOf<T>(value: T) {
	return {
		subscribe: (fn: (v: T) => void) => {
			fn(value);
			return () => {};
		},
		set: () => {},
		update: () => {}
	};
}

const defaultFormValues = {
	version: 5,
	test_timings: { mode: 'fixed', value: { time_limit: 60, start_time: null, end_time: null } },
	questions_per_page: { mode: 'fixed', value: { question_pagination: 1 } },
	marking_scheme: {
		mode: 'fixed',
		value: { correct: 1, wrong: 0, skipped: 0, partial_marking: false }
	},
	answer_review: { mode: 'fixed', value: { default: 'off' } },
	question_palette: { mode: 'fixed', value: { default: true } },
	mark_for_review: { mode: 'fixed', value: { default: true } },
	omr_mode: { mode: 'fixed', value: { default: false } },
	pause_test: { mode: 'fixed', value: { default: false } },
	pre_test_instructions: { value: { text: null } },
	completion_message: { value: { text: null } },
	platform_nomenclature: { mode: 'default', value: fillMissingNomenclatureKeys({}) },
	platform_guide: { value: { file_path: null } },
	analytics_link: { value: { url: null } }
};

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn(() => ({
		form: storeOf(defaultFormValues),
		errors: storeOf({}),
		constraints: storeOf({}),
		tainted: storeOf(undefined),
		allErrors: storeOf([]),
		posted: storeOf(false),
		message: storeOf(undefined),
		enhance: vi.fn(),
		submitting: storeOf(false)
	}))
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

vi.mock('$lib/components/RichTextEditor.svelte', () => ({
	default: vi.fn()
}));

vi.mock('$lib/components/PartialMarkingSection.svelte', () => ({
	default: vi.fn()
}));

const createPageData = () => ({
	form: { data: defaultFormValues }
});

describe('OrganizationSettingsForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Page Header', () => {
		it('should render the page heading', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByRole('heading', { name: 'Organisation Settings' })).toBeInTheDocument();
		});

		it('should render Cancel button', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
		});

		it('should render Save button', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('should have Cancel link to /organization', () => {
			const { container } = render(OrganizationSettingsForm, { data: createPageData() });
			const link = container.querySelector('a[href="/organization"]');
			expect(link).toBeInTheDocument();
		});

		it('should disable Save when form is untainted', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
		});
	});

	describe('Form Attributes', () => {
		it('should have POST method', () => {
			const { container } = render(OrganizationSettingsForm, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('should have action ?/save', () => {
			const { container } = render(OrganizationSettingsForm, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('action', '?/save');
		});
	});

	describe('Settings Cards', () => {
		it('should render Test Timings card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByText('Test Timings')).toBeInTheDocument();
		});

		it('should render Questions per Page card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByText('Questions per Page')).toBeInTheDocument();
		});

		it('should render Marking Scheme card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByText('Marking Scheme')).toBeInTheDocument();
		});

		it('should render Answer Review card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByText('Answer Review')).toBeInTheDocument();
		});

		it('should render Question Palette card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByRole('heading', { name: 'Question Palette' })).toBeInTheDocument();
		});

		it('should render Mark for Review card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByRole('heading', { name: 'Mark for Review' })).toBeInTheDocument();
		});

		it('should render OMR Mode card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByRole('heading', { name: 'OMR Mode' })).toBeInTheDocument();
		});

		it('should render Pause Test card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByRole('heading', { name: /Pause Test/ })).toBeInTheDocument();
		});

		it('should render Test Instructions card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByText('Test Instructions')).toBeInTheDocument();
		});

		it('should render Platform Nomenclature card', () => {
			render(OrganizationSettingsForm, { data: createPageData() });
			expect(screen.getByText('Platform Nomenclature')).toBeInTheDocument();
		});
	});
});
