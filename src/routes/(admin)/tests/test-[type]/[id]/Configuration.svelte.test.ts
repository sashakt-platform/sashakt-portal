import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import Configuration from './Configuration.svelte';
import type { OrgSettingsPayload } from '$lib/utils/organizationSettings';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$lib/nomenclature', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/nomenclature')>();
	return {
		...actual,
		useTerms: () => (key: string, casing?: string) => {
			const label =
				actual.NOMENCLATURE_DEFAULTS[key as keyof typeof actual.NOMENCLATURE_DEFAULTS] ?? key;
			if (casing === 'lower') return label.toLowerCase();
			return label;
		}
	};
});

vi.mock('$lib/components/RichTextEditor.svelte', () => ({
	default: vi.fn()
}));

vi.mock('$lib/components/CalendarRange.svelte', () => ({
	default: vi.fn()
}));

vi.mock('$lib/components/PartialMarkingSection.svelte', () => ({
	default: vi.fn()
}));

function defaultFormValues() {
	return {
		is_template: false,
		name: 'Test',
		description: '',
		start_time: null,
		end_time: null,
		time_limit: 60,
		pause_timer_when_inactive: false,
		shuffle: false,
		random_questions: false,
		no_of_random_questions: 0,
		question_pagination: 1,
		question_revision_ids: [],
		random_tag_count: [],
		show_marks: false,
		show_result: true,
		show_question_palette: true,
		bookmark: false,
		show_feedback_on_completion: false,
		show_feedback_immediately: false,
		locale: 'en-US',
		omr: 'NEVER',
		certificate_id: null,
		form_id: null,
		marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
		marks_level: 'question',
		start_instructions: null,
		completion_message: null
	};
}

function allFlexibleSettings(): OrgSettingsPayload {
	return {
		version: 1,
		test_timings: {
			mode: 'flexible',
			value: { time_limit: 60, start_time: null, end_time: null }
		},
		questions_per_page: { mode: 'flexible', value: { question_pagination: 1 } },
		marking_scheme: { mode: 'flexible', value: { correct: 1, wrong: 0, skipped: 0 } },
		answer_review: { mode: 'flexible', value: { default: 'off' } },
		question_palette: { mode: 'flexible', value: { default: true } },
		mark_for_review: { mode: 'flexible', value: { default: true } },
		omr_mode: { mode: 'flexible', value: { default: false } },
		pause_test: { mode: 'flexible', value: { default: false } }
	};
}

function allFixedSettings(): OrgSettingsPayload {
	return {
		version: 1,
		test_timings: {
			mode: 'fixed',
			value: { time_limit: 60, start_time: '09:00', end_time: '17:00' }
		},
		questions_per_page: { mode: 'fixed', value: { question_pagination: 1 } },
		marking_scheme: { mode: 'fixed', value: { correct: 1, wrong: 0, skipped: 0 } },
		answer_review: { mode: 'fixed', value: { default: 'off' } },
		question_palette: { mode: 'fixed', value: { default: true } },
		mark_for_review: { mode: 'fixed', value: { default: true } },
		omr_mode: { mode: 'fixed', value: { default: false } },
		pause_test: { mode: 'fixed', value: { default: false } }
	};
}

function renderConfiguration(orgSettings: OrgSettingsPayload | null) {
	const formStore = writable(defaultFormValues());
	return render(Configuration, {
		formData: formStore,
		orgSettings
	});
}

describe('Configuration — fixed org settings hide fields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
	});

	describe('test_timings', () => {
		it('hides "Maximum time limit" when test_timings is fixed', () => {
			renderConfiguration(allFixedSettings());
			expect(screen.queryByText('Maximum time limit for the test')).not.toBeInTheDocument();
		});

		it('shows "Maximum time limit" when test_timings is flexible', () => {
			renderConfiguration(allFlexibleSettings());
			expect(screen.getByText('Maximum time limit for the test')).toBeInTheDocument();
		});
	});

	describe('questions_per_page', () => {
		it('hides "Questions per page" when questions_per_page is fixed', () => {
			renderConfiguration(allFixedSettings());
			expect(
				screen.queryByText('Questions per page (0 - All questions in a page)')
			).not.toBeInTheDocument();
		});

		it('shows "Questions per page" when questions_per_page is flexible', () => {
			renderConfiguration(allFlexibleSettings());
			expect(
				screen.getByText('Questions per page (0 - All questions in a page)')
			).toBeInTheDocument();
		});
	});

	describe('marking_scheme', () => {
		it('hides "Marking Scheme" section when marking_scheme is fixed', () => {
			renderConfiguration(allFixedSettings());
			expect(screen.queryByText('Marking Scheme')).not.toBeInTheDocument();
		});

		it('shows "Marking Scheme" section when marking_scheme is flexible', () => {
			renderConfiguration(allFlexibleSettings());
			expect(screen.getByText('Marking Scheme')).toBeInTheDocument();
		});
	});

	describe('omr_mode', () => {
		it('hides "OMR Mode" dropdown when omr_mode is fixed', () => {
			renderConfiguration(allFixedSettings());
			expect(screen.queryByText('OMR Mode')).not.toBeInTheDocument();
		});

		it('shows "OMR Mode" dropdown when omr_mode is flexible', () => {
			renderConfiguration(allFlexibleSettings());
			expect(screen.getByText('OMR Mode')).toBeInTheDocument();
		});
	});

	describe('question_palette', () => {
		it('hides "Show question palette" when question_palette is fixed', () => {
			renderConfiguration(allFixedSettings());
			expect(screen.queryByText(/Show question palette during test/i)).not.toBeInTheDocument();
		});

		it('shows "Show question palette" when question_palette is flexible', () => {
			renderConfiguration(allFlexibleSettings());
			expect(screen.getByText(/Show question palette during test/i)).toBeInTheDocument();
		});
	});

	describe('mark_for_review', () => {
		it('hides "Enable mark for review" when mark_for_review is fixed', () => {
			renderConfiguration(allFixedSettings());
			expect(screen.queryByText('Enable mark for review')).not.toBeInTheDocument();
		});

		it('shows "Enable mark for review" when mark_for_review is flexible', () => {
			renderConfiguration(allFlexibleSettings());
			expect(screen.getByText('Enable mark for review')).toBeInTheDocument();
		});
	});

	describe('answer_review', () => {
		it('hides feedback toggles when answer_review is fixed', () => {
			renderConfiguration(allFixedSettings());
			expect(screen.queryByText(/Show feedback after test completion/i)).not.toBeInTheDocument();
			expect(
				screen.queryByText('Show feedback immediately after each question')
			).not.toBeInTheDocument();
		});

		it('shows feedback toggles when answer_review is flexible', () => {
			renderConfiguration(allFlexibleSettings());
			expect(screen.getByText(/Show feedback after test completion/i)).toBeInTheDocument();
			expect(screen.getByText('Show feedback immediately after each question')).toBeInTheDocument();
		});
	});

	describe('pause_test', () => {
		it('hides "Pause timer" when pause_test is fixed', () => {
			renderConfiguration(allFixedSettings());
			expect(
				screen.queryByText('Pause timer when candidate leaves the test window')
			).not.toBeInTheDocument();
		});

		it('shows "Pause timer" when pause_test is flexible', () => {
			renderConfiguration(allFlexibleSettings());
			expect(
				screen.getByText('Pause timer when candidate leaves the test window')
			).toBeInTheDocument();
		});
	});

	describe('null orgSettings (no settings configured)', () => {
		it('shows all configuration fields when orgSettings is null', () => {
			renderConfiguration(null);

			expect(screen.getByText('Maximum time limit for the test')).toBeInTheDocument();
			expect(
				screen.getByText('Questions per page (0 - All questions in a page)')
			).toBeInTheDocument();
			expect(screen.getByText('Marking Scheme')).toBeInTheDocument();
			expect(screen.getByText('OMR Mode')).toBeInTheDocument();
			expect(screen.getByText(/Show question palette during test/i)).toBeInTheDocument();
			expect(screen.getByText('Enable mark for review')).toBeInTheDocument();
			expect(screen.getByText(/Show feedback after test completion/i)).toBeInTheDocument();
			expect(screen.getByText('Show feedback immediately after each question')).toBeInTheDocument();
			expect(
				screen.getByText('Pause timer when candidate leaves the test window')
			).toBeInTheDocument();
		});
	});

	describe('mixed fixed/flexible settings', () => {
		it('hides only the fixed fields when some settings are fixed and others are flexible', () => {
			const settings = allFlexibleSettings();
			settings.test_timings.mode = 'fixed';
			settings.omr_mode.mode = 'fixed';
			settings.marking_scheme.mode = 'fixed';

			renderConfiguration(settings);

			expect(screen.queryByText('Maximum time limit for the test')).not.toBeInTheDocument();
			expect(screen.queryByText('OMR Mode')).not.toBeInTheDocument();
			expect(screen.queryByText('Marking Scheme')).not.toBeInTheDocument();

			expect(
				screen.getByText('Questions per page (0 - All questions in a page)')
			).toBeInTheDocument();
			expect(screen.getByText(/Show question palette during test/i)).toBeInTheDocument();
			expect(screen.getByText('Enable mark for review')).toBeInTheDocument();
			expect(screen.getByText(/Show feedback after test completion/i)).toBeInTheDocument();
			expect(
				screen.getByText('Pause timer when candidate leaves the test window')
			).toBeInTheDocument();
		});
	});
});
