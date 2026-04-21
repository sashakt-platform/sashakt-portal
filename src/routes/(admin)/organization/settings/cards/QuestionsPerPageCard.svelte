<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import FeatureCard from '../FeatureCard.svelte';
	import type { OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="Questions per Page"
	description="Set how many questions appear on each page"
	bind:mode={settings.questions_per_page.mode}
>
	<div class="flex items-center justify-between gap-4">
		<span class="text-gray-500 text-sm font-semibold">Enter number of questions</span>
		<Input
			type="number"
			min="0"
			class="h-9 w-[176px] rounded-[10px] text-right"
			bind:value={settings.questions_per_page.value.question_pagination}
		/>
	</div>
</FeatureCard>
