import { describe, it, expect } from 'vitest';
import {
	isFixed,
	isDisabled,
	applyOrgSettingsToNewTestForm,
	type OrgSettingsPayload
} from './organizationSettings';

function settings(overrides: Partial<OrgSettingsPayload> = {}): OrgSettingsPayload {
	return {
		version: 1,
		test_timings: {
			mode: 'fixed',
			value: { time_limit: 60, start_time: '09:00:00', end_time: '17:00:00' }
		},
		questions_per_page: { mode: 'fixed', value: { question_pagination: 1 } },
		marking_scheme: { mode: 'fixed', value: { correct: 1, wrong: 0, skipped: 0 } },
		answer_review: { mode: 'fixed', value: { default: 'off' } },
		question_palette: { mode: 'fixed', value: { default: true } },
		mark_for_review: { mode: 'fixed', value: { default: true } },
		omr_mode: { mode: 'fixed', value: { default: false } },
		...overrides
	};
}

describe('isFixed', () => {
	it('returns true for fixed features', () => {
		expect(isFixed(settings(), 'test_timings')).toBe(true);
		expect(isFixed(settings(), 'omr_mode')).toBe(true);
	});

	it('returns false for flexible features', () => {
		const s = settings({
			test_timings: {
				mode: 'flexible',
				value: { time_limit: null, start_time: null, end_time: null }
			}
		});
		expect(isFixed(s, 'test_timings')).toBe(false);
	});

	it('returns false when settings is null', () => {
		expect(isFixed(null, 'omr_mode')).toBe(false);
	});
});

describe('isDisabled', () => {
	it('returns true for fixed + off-equivalent omr', () => {
		expect(isDisabled(settings(), 'omr_mode')).toBe(true); // default=false
	});

	it('returns false for fixed + on omr', () => {
		const s = settings({ omr_mode: { mode: 'fixed', value: { default: true } } });
		expect(isDisabled(s, 'omr_mode')).toBe(false);
	});

	it('returns true for fixed + off answer review', () => {
		expect(isDisabled(settings(), 'answer_review')).toBe(true); // default='off'
	});

	it('returns false for fixed + non-off answer review', () => {
		const s = settings({ answer_review: { mode: 'fixed', value: { default: 'end_of_test' } } });
		expect(isDisabled(s, 'answer_review')).toBe(false);
	});

	it('returns true for fixed + off palette', () => {
		const s = settings({ question_palette: { mode: 'fixed', value: { default: false } } });
		expect(isDisabled(s, 'question_palette')).toBe(true);
	});

	it('returns false for flexible features', () => {
		const s = settings({ omr_mode: { mode: 'flexible', value: { default: false } } });
		expect(isDisabled(s, 'omr_mode')).toBe(false);
	});

	it('always returns false for always-enabled features', () => {
		expect(isDisabled(settings(), 'test_timings')).toBe(false);
		expect(isDisabled(settings(), 'questions_per_page')).toBe(false);
		expect(isDisabled(settings(), 'marking_scheme')).toBe(false);
	});
});

describe('applyOrgSettingsToNewTestForm', () => {
	it('copies time_limit, question_pagination, marking_scheme', () => {
		const formData: any = {};
		applyOrgSettingsToNewTestForm(formData, settings());
		expect(formData.time_limit).toBe(60);
		expect(formData.question_pagination).toBe(1);
		expect(formData.marking_scheme).toEqual({ correct: 1, wrong: 0, skipped: 0 });
	});

	it('forces marks_level to test when marking_scheme is fixed', () => {
		const formData: any = {};
		applyOrgSettingsToNewTestForm(formData, settings());
		expect(formData.marks_level).toBe('test');
	});

	it('does not force marks_level when marking_scheme is flexible', () => {
		const formData: any = {};
		const s = settings({
			marking_scheme: { mode: 'flexible', value: { correct: 1, wrong: 0, skipped: 0 } }
		});
		applyOrgSettingsToNewTestForm(formData, s);
		expect(formData.marks_level).toBeUndefined();
	});

	it('maps answer_review=off to both feedback flags false', () => {
		const formData: any = {};
		applyOrgSettingsToNewTestForm(formData, settings());
		expect(formData.show_feedback_immediately).toBe(false);
		expect(formData.show_feedback_on_completion).toBe(false);
	});

	it('maps answer_review=after_each_question to (true, false)', () => {
		const formData: any = {};
		const s = settings({
			answer_review: { mode: 'fixed', value: { default: 'after_each_question' } }
		});
		applyOrgSettingsToNewTestForm(formData, s);
		expect(formData.show_feedback_immediately).toBe(true);
		expect(formData.show_feedback_on_completion).toBe(false);
	});

	it('maps answer_review=end_of_test to (false, true)', () => {
		const formData: any = {};
		const s = settings({ answer_review: { mode: 'fixed', value: { default: 'end_of_test' } } });
		applyOrgSettingsToNewTestForm(formData, s);
		expect(formData.show_feedback_immediately).toBe(false);
		expect(formData.show_feedback_on_completion).toBe(true);
	});

	it('maps answer_review=after_question_and_after_test to (true, true)', () => {
		const formData: any = {};
		const s = settings({
			answer_review: { mode: 'fixed', value: { default: 'after_question_and_after_test' } }
		});
		applyOrgSettingsToNewTestForm(formData, s);
		expect(formData.show_feedback_immediately).toBe(true);
		expect(formData.show_feedback_on_completion).toBe(true);
	});

	it('copies palette and mark-for-review from their own feature blocks', () => {
		const formData: any = {};
		const s = settings({
			question_palette: { mode: 'flexible', value: { default: true } },
			mark_for_review: { mode: 'flexible', value: { default: false } }
		});
		applyOrgSettingsToNewTestForm(formData, s);
		expect(formData.show_question_palette).toBe(true);
		expect(formData.bookmark).toBe(false);
	});

	it('maps omr fixed+true to ALWAYS', () => {
		const formData: any = {};
		const s = settings({ omr_mode: { mode: 'fixed', value: { default: true } } });
		applyOrgSettingsToNewTestForm(formData, s);
		expect(formData.omr).toBe('ALWAYS');
	});

	it('maps omr fixed+false to NEVER', () => {
		const formData: any = {};
		applyOrgSettingsToNewTestForm(formData, settings());
		expect(formData.omr).toBe('NEVER');
	});

	it('maps omr flexible to OPTIONAL regardless of default', () => {
		const formData: any = {};
		const s = settings({ omr_mode: { mode: 'flexible', value: { default: true } } });
		applyOrgSettingsToNewTestForm(formData, s);
		expect(formData.omr).toBe('OPTIONAL');
	});

	it('no-op when settings is null', () => {
		const formData: any = { time_limit: 999 };
		applyOrgSettingsToNewTestForm(formData, null);
		expect(formData.time_limit).toBe(999);
	});
});
