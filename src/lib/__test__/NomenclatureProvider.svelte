<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import {
		NOMENCLATURE_CONTEXT_KEY,
		NOMENCLATURE_DEFAULTS,
		type NomenclatureKey
	} from '$lib/nomenclature';

	let {
		overrides = {},
		children
	}: {
		overrides?: Partial<Record<NomenclatureKey, string>>;
		children: Snippet;
	} = $props();

	const resolved = $derived({ ...NOMENCLATURE_DEFAULTS, ...overrides });
	setContext(NOMENCLATURE_CONTEXT_KEY, () => resolved);
</script>

{@render children()}
