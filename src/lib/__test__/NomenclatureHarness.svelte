<script lang="ts">
	import { setContext } from 'svelte';
	import {
		NOMENCLATURE_CONTEXT_KEY,
		NOMENCLATURE_DEFAULTS,
		useTerms,
		type NomenclatureKey
	} from '$lib/nomenclature';

	let {
		overrides = {},
		key,
		casing = 'title'
	}: {
		overrides?: Partial<Record<NomenclatureKey, string>>;
		key: NomenclatureKey;
		casing?: 'title' | 'lower' | 'upper';
	} = $props();

	const resolved = $derived({ ...NOMENCLATURE_DEFAULTS, ...overrides });
	setContext(NOMENCLATURE_CONTEXT_KEY, () => resolved);

	const term = useTerms();
</script>

<span data-testid="resolved">{term(key, casing)}</span>
