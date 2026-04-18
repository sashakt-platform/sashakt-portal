<script lang="ts">
	import FeatureCard from '../FeatureCard.svelte';
	import OnOffToggle from '../OnOffToggle.svelte';
	import type { OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="Mark for Review"
	description="Let candidates flag questions to revisit before submitting the test"
	bind:mode={settings.mark_for_review.mode}
>
	<div class="flex items-center justify-between gap-4">
		<span class="text-sm font-medium">Mark for Review</span>
		<OnOffToggle bind:value={settings.mark_for_review.value.default} />
	</div>
</FeatureCard>
