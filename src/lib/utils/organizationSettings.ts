/**
 * Helpers for applying organization settings to the test create/edit form.
 * Mirrors `services/organization_settings_mapper.py` on the backend.
 */

export type OrgSettingMode = 'fixed' | 'flexible';

export type OrgSettingsPayload = {
	version: number;
	test_timings: {
		mode: OrgSettingMode;
		value: {
			time_limit: number | null;
			start_time: string | null;
			end_time: string | null;
		};
	};
	questions_per_page: {
		mode: OrgSettingMode;
		value: { question_pagination: number };
	};
	marking_scheme: {
		mode: OrgSettingMode;
		value: {
			correct: number;
			wrong: number;
			skipped: number;
			partial?: { correct_answers: { num_correct_selected: number; marks: number }[] };
		};
	};
	answer_review: {
		mode: OrgSettingMode;
		value: {
			default: 'off' | 'after_each_question' | 'end_of_test' | 'after_question_and_after_test';
		};
	};
	question_palette: {
		mode: OrgSettingMode;
		value: { default: boolean };
	};
	mark_for_review: {
		mode: OrgSettingMode;
		value: { default: boolean };
	};
	omr_mode: {
		mode: OrgSettingMode;
		value: { default: boolean };
	};
	pause_test: {
		mode: OrgSettingMode;
		value: { default: boolean };
	};
	pre_test_instructions?: {
		value: { text: string | null };
	};
	completion_message?: {
		value: { text: string | null };
	};
};

type Feature = keyof Omit<
	OrgSettingsPayload,
	'version' | 'pre_test_instructions' | 'completion_message'
>;

export function isFixed(settings: OrgSettingsPayload | null, feature: Feature): boolean {
	if (!settings) return false;
	return settings[feature].mode === 'fixed';
}

/**
 * A feature is "disabled" when it's fixed AND its value is off-equivalent.
 * Hides the corresponding field in the test form.
 */
export function isDisabled(settings: OrgSettingsPayload | null, feature: Feature): boolean {
	if (!settings) return false;
	if (!isFixed(settings, feature)) return false;
	const value: any = settings[feature].value;
	switch (feature) {
		case 'omr_mode':
		case 'question_palette':
		case 'mark_for_review':
		case 'pause_test':
			return value.default === false;
		case 'answer_review':
			return value.default === 'off';
		default:
			// test_timings, questions_per_page, marking_scheme are always enabled
			return false;
	}
}

function answerReviewToFlags(option: OrgSettingsPayload['answer_review']['value']['default']): {
	show_feedback_immediately: boolean;
	show_feedback_on_completion: boolean;
} {
	switch (option) {
		case 'after_each_question':
			return { show_feedback_immediately: true, show_feedback_on_completion: false };
		case 'end_of_test':
			return { show_feedback_immediately: false, show_feedback_on_completion: true };
		case 'after_question_and_after_test':
			return { show_feedback_immediately: true, show_feedback_on_completion: true };
		case 'off':
		default:
			return { show_feedback_immediately: false, show_feedback_on_completion: false };
	}
}

/**
 * Prefill the test form data from org settings. Called only when creating a new test.
 * For flexible features this is a default (user can still override).
 * For fixed features the backend will overwrite anyway — prefilling keeps the UI in sync.
 *
 * Does NOT prefill `start_time`/`end_time` on the test row — those are the test's
 * date-period, distinct from the org's time-of-day window.
 */
export function applyOrgSettingsToNewTestForm(
	formData: Record<string, any>,
	settings: OrgSettingsPayload | null
): void {
	if (!settings) return;

	formData.time_limit = settings.test_timings.value.time_limit;
	formData.question_pagination = settings.questions_per_page.value.question_pagination;
	formData.marking_scheme = structuredClone(settings.marking_scheme.value);
	// Force test-level marking when the org fixes marking_scheme, otherwise
	// the default (question-level) would ignore the org's scheme entirely.
	if (settings.marking_scheme.mode === 'fixed') {
		formData.marks_level = 'test';
	}

	const flags = answerReviewToFlags(settings.answer_review.value.default);
	formData.show_feedback_immediately = flags.show_feedback_immediately;
	formData.show_feedback_on_completion = flags.show_feedback_on_completion;

	formData.show_question_palette = settings.question_palette.value.default;
	formData.bookmark = settings.mark_for_review.value.default;
	formData.pause_timer_when_inactive = settings.pause_test.value.default;

	const omrMode = settings.omr_mode.mode;
	const omrDefault = settings.omr_mode.value.default;
	if (omrMode === 'fixed') {
		formData.omr = omrDefault ? 'ALWAYS' : 'NEVER';
	} else {
		formData.omr = 'OPTIONAL';
	}

	formData.start_instructions = settings.pre_test_instructions?.value?.text ?? null;
	formData.completion_message = settings.completion_message?.value?.text ?? null;
}
