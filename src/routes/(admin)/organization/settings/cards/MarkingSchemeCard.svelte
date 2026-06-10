<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import PartialMarkingSection from '$lib/components/PartialMarkingSection.svelte';
	import FeatureCard from '../FeatureCard.svelte';
	import type { OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="Marking Scheme"
	description="Set marks awarded for correct, incorrect, and partially correct answers"
	bind:mode={settings.marking_scheme.mode}
>
	<div class="flex flex-col gap-6 lg:flex-row lg:gap-6">
		<div class="flex flex-col gap-3 lg:w-2/5">
			<p class="text-sm font-semibold text-muted-foreground">Absolute Marking</p>
			<div class="grid grid-cols-3 gap-2">
				<div class="flex flex-col gap-1">
					<small class="text-muted-foreground whitespace-nowrap">Correct</small>
					<Input type="number" placeholder="0" bind:value={settings.marking_scheme.value.correct} />
				</div>
				<div class="flex flex-col gap-1">
					<small class="text-muted-foreground whitespace-nowrap">Incorrect</small>
					<Input type="number" placeholder="0" bind:value={settings.marking_scheme.value.wrong} />
				</div>
				<div class="flex flex-col gap-1">
					<small class="text-muted-foreground whitespace-nowrap">No Answer</small>
					<Input type="number" placeholder="0" bind:value={settings.marking_scheme.value.skipped} />
				</div>
			</div>
		</div>

		<div class="border-border lg:border-l"></div>

		<div class="lg:w-3/5">
			<PartialMarkingSection
				bind:partial={settings.marking_scheme.value.partial}
				bordered={false}
			/>
		</div>
	</div>
</FeatureCard>
