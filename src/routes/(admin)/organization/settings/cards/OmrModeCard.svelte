<script lang="ts">
	import FeatureCard from '../FeatureCard.svelte';
	import OnOffToggle from '../OnOffToggle.svelte';
	import type { OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="OMR Mode"
	description="Show the test in a digital OMR sheet format"
	bind:mode={settings.omr_mode.mode}
>
	<div class="flex items-center justify-between gap-4">
		<span class="text-sm font-medium">OMR Mode</span>
		<OnOffToggle bind:value={settings.omr_mode.value.default} />
	</div>
</FeatureCard>
