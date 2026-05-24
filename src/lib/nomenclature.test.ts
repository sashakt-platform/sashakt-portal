import { describe, it, expect } from 'vitest';
import {
	NOMENCLATURE_DEFAULTS,
	MAX_NOMENCLATURE_LABEL_LEN,
	defaultNomenclatureSetting,
	emptyNomenclatureValue,
	resolveAll,
	resolveLabel,
	resolveTerm,
	type NomenclatureKey,
	type PlatformNomenclatureSetting
} from './nomenclature';

function customSetting(
	overrides: Partial<Record<NomenclatureKey, string>> = {},
	mode: 'default' | 'custom' = 'custom'
): PlatformNomenclatureSetting {
	return {
		mode,
		value: { ...emptyNomenclatureValue(), ...overrides }
	};
}

describe('nomenclature', () => {
	describe('constants', () => {
		it('exposes the 20 expected keys', () => {
			const keys = Object.keys(NOMENCLATURE_DEFAULTS).sort();
			expect(keys).toEqual(
				[
					'certificate',
					'certificates',
					'dashboard',
					'entities',
					'entity',
					'form',
					'forms',
					'organisations',
					'question_bank',
					'tag',
					'tag_management',
					'tag_type',
					'tag_types',
					'tags',
					'test',
					'test_template',
					'test_templates',
					'tests',
					'user',
					'users'
				].sort()
			);
		});

		it('caps label length at 50', () => {
			expect(MAX_NOMENCLATURE_LABEL_LEN).toBe(50);
		});
	});

	describe('emptyNomenclatureValue', () => {
		it('returns one empty string per default key', () => {
			const value = emptyNomenclatureValue();
			for (const key of Object.keys(NOMENCLATURE_DEFAULTS)) {
				expect(value[key as NomenclatureKey]).toBe('');
			}
		});
	});

	describe('defaultNomenclatureSetting', () => {
		it('returns mode="default" with empty values', () => {
			const setting = defaultNomenclatureSetting();
			expect(setting.mode).toBe('default');
			expect(setting.value.tests).toBe('');
		});
	});

	describe('resolveLabel', () => {
		it('returns built-in for mode=default, ignoring value', () => {
			const setting = customSetting({ tests: 'Exams' }, 'default');
			expect(resolveLabel(setting, 'tests')).toBe('Tests');
		});

		it('returns custom for mode=custom with non-empty value', () => {
			const setting = customSetting({ tests: 'Exams' });
			expect(resolveLabel(setting, 'tests')).toBe('Exams');
		});

		it('returns built-in for mode=custom with empty string', () => {
			const setting = customSetting({ tests: '' });
			expect(resolveLabel(setting, 'tests')).toBe('Tests');
		});

		it('returns built-in when custom value is whitespace-only (.trim())', () => {
			const setting = customSetting({ tests: '   ' });
			expect(resolveLabel(setting, 'tests')).toBe('Tests');
		});

		it('honors per-key overrides independently', () => {
			const setting = customSetting({ tests: 'Exams', users: 'Members' });
			expect(resolveLabel(setting, 'tests')).toBe('Exams');
			expect(resolveLabel(setting, 'users')).toBe('Members');
			// Untouched key falls back to default
			expect(resolveLabel(setting, 'tags')).toBe('Tags');
		});
	});

	describe('resolveAll', () => {
		it('returns one resolved label per key', () => {
			const setting = customSetting({ tests: 'Exams' });
			const all = resolveAll(setting);
			expect(all.tests).toBe('Exams');
			expect(all.tags).toBe('Tags');
			expect(Object.keys(all)).toHaveLength(Object.keys(NOMENCLATURE_DEFAULTS).length);
		});
	});

	describe('resolveTerm (case-aware)', () => {
		const setting = customSetting({ tests: 'Exams', tag_types: 'Topic Types' });

		it('defaults to title case (returns label as stored)', () => {
			expect(resolveTerm(setting, 'tests')).toBe('Exams');
			expect(resolveTerm(setting, 'tag_types')).toBe('Topic Types');
		});

		it('lowercases when casing="lower"', () => {
			expect(resolveTerm(setting, 'tests', 'lower')).toBe('exams');
			expect(resolveTerm(setting, 'tag_types', 'lower')).toBe('topic types');
		});

		it('uppercases when casing="upper"', () => {
			expect(resolveTerm(setting, 'tests', 'upper')).toBe('EXAMS');
			expect(resolveTerm(setting, 'tag_types', 'upper')).toBe('TOPIC TYPES');
		});

		it('applies casing on the built-in fallback too', () => {
			const defaultSetting = defaultNomenclatureSetting();
			expect(resolveTerm(defaultSetting, 'users', 'lower')).toBe('users');
			expect(resolveTerm(defaultSetting, 'users', 'upper')).toBe('USERS');
		});
	});
});
