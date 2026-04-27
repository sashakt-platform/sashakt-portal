<script lang="ts">
	import FeatureCard from '../FeatureCard.svelte';
	import OnOffToggle from '../OnOffToggle.svelte';
	import type { OrganizationSettings } from '../schema';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="Mark for Review"
	description={`Let candidates flag questions to revisit before submitting the ${term('test', 'lower')}`}
	bind:mode={settings.mark_for_review.mode}
>
	<div class="flex items-center justify-between gap-4">
		<span class="text-sm font-semibold text-gray-500">Mark for Review</span>
		<OnOffToggle bind:value={settings.mark_for_review.value.default} />
	</div>
</FeatureCard>
