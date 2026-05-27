import { describe, it, expect } from 'vitest';
import {
	organizationSettingsSchema,
	fillMissingNomenclatureKeys,
	trimSeconds,
	withSeconds
} from './schema';
import { MAX_NOMENCLATURE_LABEL_LEN, NOMENCLATURE_DEFAULTS } from '$lib/nomenclature';

function validBaseSettings() {
	return {
		version: 5,
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
		pause_test: { mode: 'fixed', value: { default: false } },
		platform_nomenclature: {
			mode: 'default',
			value: fillMissingNomenclatureKeys({})
		},
		platform_guide: { value: { file_path: null } },
		analytics_link: { value: { url: null } }
	};
}

describe('organizationSettingsSchema — platform_nomenclature', () => {
	it('accepts a valid payload with default mode and empty values', () => {
		const result = organizationSettingsSchema.safeParse(validBaseSettings());
		expect(result.success).toBe(true);
	});

	it('accepts a valid custom payload with non-empty labels', () => {
		const settings = validBaseSettings();
		settings.platform_nomenclature = {
			mode: 'custom',
			value: { ...fillMissingNomenclatureKeys({}), tests: 'Exams', user: 'Member' }
		};
		const result = organizationSettingsSchema.safeParse(settings);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.platform_nomenclature.value.tests).toBe('Exams');
			expect(result.data.platform_nomenclature.value.user).toBe('Member');
		}
	});

	it('rejects label longer than 50 chars and surfaces an error', () => {
		const settings = validBaseSettings();
		const overflow = 'x'.repeat(MAX_NOMENCLATURE_LABEL_LEN + 1);
		settings.platform_nomenclature = {
			mode: 'custom',
			value: { ...fillMissingNomenclatureKeys({}), tests: overflow }
		};

		const result = organizationSettingsSchema.safeParse(settings);
		expect(result.success).toBe(false);
		if (!result.success) {
			const flat = result.error.flatten();
			// zod-flattened errors land under the deep field path
			const fieldErrors = JSON.stringify(flat.fieldErrors);
			expect(fieldErrors).toContain(`${MAX_NOMENCLATURE_LABEL_LEN}`);
		}
	});

	it('trims whitespace from custom labels via .transform()', () => {
		const settings = validBaseSettings();
		settings.platform_nomenclature = {
			mode: 'custom',
			value: { ...fillMissingNomenclatureKeys({}), tests: '  Exams  ' }
		};
		const result = organizationSettingsSchema.safeParse(settings);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.platform_nomenclature.value.tests).toBe('Exams');
		}
	});

	it('rejects mode values other than "default" / "custom"', () => {
		const settings = validBaseSettings();
		// @ts-expect-error - intentionally invalid
		settings.platform_nomenclature = {
			mode: 'flexible',
			value: fillMissingNomenclatureKeys({})
		};
		const result = organizationSettingsSchema.safeParse(settings);
		expect(result.success).toBe(false);
	});

	it('rejects payload missing the platform_nomenclature key entirely', () => {
		const settings = validBaseSettings() as Record<string, unknown>;
		delete settings.platform_nomenclature;
		const result = organizationSettingsSchema.safeParse(settings);
		expect(result.success).toBe(false);
	});

	it('pins version to literal 5', () => {
		const settings = validBaseSettings();
		settings.version = 2 as 5; // wrong version
		const result = organizationSettingsSchema.safeParse(settings);
		expect(result.success).toBe(false);
	});
});

describe('organizationSettingsSchema — platform_guide & analytics_link', () => {
	it('accepts null file_path and null url', () => {
		const result = organizationSettingsSchema.safeParse(validBaseSettings());
		expect(result.success).toBe(true);
	});

	it('accepts a resolved file_path URL and analytics URL', () => {
		const settings = validBaseSettings();
		settings.platform_guide = { value: { file_path: 'https://cdn.example.com/guide.pdf' } };
		settings.analytics_link = { value: { url: 'https://lookerstudio.google.com/abc' } };
		const result = organizationSettingsSchema.safeParse(settings);
		expect(result.success).toBe(true);
	});

	it('rejects payloads missing platform_guide or analytics_link', () => {
		const s1 = validBaseSettings() as Record<string, unknown>;
		delete s1.platform_guide;
		expect(organizationSettingsSchema.safeParse(s1).success).toBe(false);

		const s2 = validBaseSettings() as Record<string, unknown>;
		delete s2.analytics_link;
		expect(organizationSettingsSchema.safeParse(s2).success).toBe(false);
	});
});

describe('fillMissingNomenclatureKeys', () => {
	it('returns one empty string per default key when given empty input', () => {
		const filled = fillMissingNomenclatureKeys({});
		for (const key of Object.keys(NOMENCLATURE_DEFAULTS)) {
			expect(filled[key as keyof typeof NOMENCLATURE_DEFAULTS]).toBe('');
		}
	});

	it('preserves provided keys and fills missing ones', () => {
		const filled = fillMissingNomenclatureKeys({ tests: 'Exams' });
		expect(filled.tests).toBe('Exams');
		expect(filled.tags).toBe('');
		expect(filled.user).toBe('');
	});

	it('handles undefined / null input', () => {
		expect(fillMissingNomenclatureKeys(undefined).tests).toBe('');
		expect(fillMissingNomenclatureKeys(null).tests).toBe('');
	});
});

describe('trimSeconds / withSeconds', () => {
	it('trimSeconds drops :SS suffix', () => {
		expect(trimSeconds('09:30:00')).toBe('09:30');
		expect(trimSeconds('09:30')).toBe('09:30');
	});

	it('trimSeconds returns null for empty / null input', () => {
		expect(trimSeconds(null)).toBe(null);
		expect(trimSeconds(undefined)).toBe(null);
		expect(trimSeconds('')).toBe(null);
	});

	it('withSeconds appends :00 to HH:MM', () => {
		expect(withSeconds('09:30')).toBe('09:30:00');
		expect(withSeconds('09:30:00')).toBe('09:30:00');
	});

	it('withSeconds returns null for empty input', () => {
		expect(withSeconds(null)).toBe(null);
	});
});
