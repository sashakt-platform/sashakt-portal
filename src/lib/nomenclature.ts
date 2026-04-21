import { getContext } from 'svelte';

export const NOMENCLATURE_DEFAULTS = {
	dashboard: 'Dashboard',
	question_bank: 'Question Bank',
	test_templates: 'Test Templates',
	tests: 'Tests',
	tag_management: 'Tag Management',
	tags: 'Tags',
	tag_types: 'Tag Types',
	forms: 'Forms',
	certificates: 'Certificates',
	entities: 'Entities',
	users: 'Users'
} as const;

export type NomenclatureKey = keyof typeof NOMENCLATURE_DEFAULTS;

export const MAX_NOMENCLATURE_LABEL_LEN = 50;

export type PlatformNomenclatureValue = Record<NomenclatureKey, string>;

export type PlatformNomenclatureMode = 'default' | 'custom';

export type PlatformNomenclatureSetting = {
	mode: PlatformNomenclatureMode;
	value: PlatformNomenclatureValue;
};

export const NOMENCLATURE_CONTEXT_KEY = 'nomenclature';

export function emptyNomenclatureValue(): PlatformNomenclatureValue {
	const result = {} as PlatformNomenclatureValue;
	for (const key of Object.keys(NOMENCLATURE_DEFAULTS) as NomenclatureKey[]) {
		result[key] = '';
	}
	return result;
}

export function defaultNomenclatureSetting(): PlatformNomenclatureSetting {
	return { mode: 'default', value: emptyNomenclatureValue() };
}

export function resolveLabel(
	nomenclature: PlatformNomenclatureSetting,
	key: NomenclatureKey
): string {
	if (nomenclature.mode === 'custom') {
		const custom = nomenclature.value[key]?.trim();
		if (custom) return custom;
	}
	return NOMENCLATURE_DEFAULTS[key];
}

export function resolveAll(
	nomenclature: PlatformNomenclatureSetting
): Record<NomenclatureKey, string> {
	const result = {} as Record<NomenclatureKey, string>;
	for (const key of Object.keys(NOMENCLATURE_DEFAULTS) as NomenclatureKey[]) {
		result[key] = resolveLabel(nomenclature, key);
	}
	return result;
}

export type NomenclatureContext = () => Record<NomenclatureKey, string>;

export function useTerm(key: NomenclatureKey): string {
	const ctx = getContext<NomenclatureContext | undefined>(NOMENCLATURE_CONTEXT_KEY);
	const resolved = ctx?.();
	return resolved?.[key] ?? NOMENCLATURE_DEFAULTS[key];
}
