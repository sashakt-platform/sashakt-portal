<script lang="ts">
	import FeatureCard from '../FeatureCard.svelte';
	import OnOffToggle from '../OnOffToggle.svelte';
	import type { OrganizationSettings } from '../schema';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="Pause {term('test')}"
	description="Allow {term('test', 'lower')} takers to pause and resume a {term('test', 'lower')} session"
	bind:mode={settings.pause_test.mode}
>
	<div class="flex items-center justify-between gap-4">
		<span class="text-sm font-semibold text-muted-foreground">Pause {term('test')}</span>
		<OnOffToggle bind:value={settings.pause_test.value.default} />
	</div>
</FeatureCard>
