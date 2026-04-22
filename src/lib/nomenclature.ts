import { getContext } from 'svelte';

export const NOMENCLATURE_DEFAULTS = {
	dashboard: 'Dashboard',
	question_bank: 'Question Bank',
	tag_management: 'Tag Management',
	tests: 'Tests',
	test: 'Test',
	tags: 'Tags',
	tag: 'Tag',
	test_templates: 'Test Templates',
	test_template: 'Test Template',
	tag_types: 'Tag Types',
	tag_type: 'Tag Type',
	forms: 'Forms',
	form: 'Form',
	certificates: 'Certificates',
	certificate: 'Certificate',
	entities: 'Entities',
	entity: 'Entity',
	users: 'Users',
	user: 'User'
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

/**
 * Casing modifier applied to the resolved label.
 *
 * - `'title'` (default) — return the label as stored (Title Case for built-in
 *   defaults; whatever the admin entered for custom labels).
 * - `'lower'` — lowercase the resolved label, useful inside sentence-cased copy
 *   like `` `No ${term('tags', 'lower')} yet` ``.
 * - `'upper'` — uppercase the label, useful for column-header / chip styling.
 */
export type TermCase = 'title' | 'lower' | 'upper';

function applyCase(label: string, casing: TermCase): string {
	switch (casing) {
		case 'lower':
			return label.toLowerCase();
		case 'upper':
			return label.toUpperCase();
		case 'title':
		default:
			return label;
	}
}

/**
 * Resolve a label and apply the requested casing. Pure helper — call from any
 * non-component context (server actions, utility modules) where the
 * `PlatformNomenclatureSetting` is already available.
 */
export function resolveTerm(
	nomenclature: PlatformNomenclatureSetting,
	key: NomenclatureKey,
	casing: TermCase = 'title'
): string {
	return applyCase(resolveLabel(nomenclature, key), casing);
}

/**
 * Capture the nomenclature context at component init time and return a resolver
 * usable anywhere (templates, snippets, derived, effects). The resolver always
 * reads the latest value via the context getter, so labels stay reactive.
 *
 * Must be called during component initialization as we use `getContext`
 *
 * Use this when looking up multiple keys or when the lookup
 * happens inside templates / snippets.
 *
 * Pass `casing` to control how the label renders inline:
 * `term('tags')` → "Tags", `term('tags', 'lower')` → "tags",
 * `term('tag_types', 'upper')` → "TAG TYPES".
 */
export function useTerms(): (key: NomenclatureKey, casing?: TermCase) => string {
	const ctx = getContext<NomenclatureContext | undefined>(NOMENCLATURE_CONTEXT_KEY);
	return (key, casing = 'title') =>
		applyCase(ctx?.()?.[key] ?? NOMENCLATURE_DEFAULTS[key], casing);
}

/**
 * Single-key convenience wrapper. Must be called during component initialization
 * For repeated lookups in templates, prefer {@link useTerms}.
 */
export function useTerm(key: NomenclatureKey, casing: TermCase = 'title'): string {
	return useTerms()(key, casing);
}
