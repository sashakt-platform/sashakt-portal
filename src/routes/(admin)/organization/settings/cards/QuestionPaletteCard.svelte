<script lang="ts">
	import FeatureCard from '../FeatureCard.svelte';
	import OnOffToggle from '../OnOffToggle.svelte';
	import type { OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="Question Palette"
	description="Give candidates a grid view of all questions to track question status throughout the test"
	bind:mode={settings.question_palette.mode}
>
	<div class="flex items-center justify-between gap-4">
		<span class="text-gray-500 text-sm font-semibold">Question Palette</span>
		<OnOffToggle bind:value={settings.question_palette.value.default} />
	</div>
</FeatureCard>
