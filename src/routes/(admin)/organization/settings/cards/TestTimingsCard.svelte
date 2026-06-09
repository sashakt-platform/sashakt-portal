<script lang="ts">
	import FeatureCard from '../FeatureCard.svelte';
	import TimePickerPill from '../TimePickerPill.svelte';
	import type { OrganizationSettings } from '../schema';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title={`${term('test')} Timings`}
	description={`Set when the ${term('test', 'lower')} starts and how long candidates have to complete it`}
	bind:mode={settings.test_timings.mode}
>
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-4">
			<span class="text-sm font-semibold text-muted-foreground">
				Maximum time limit for the {term('test', 'lower')}
			</span>
			<label
				class="border-input focus-within:border-ring focus-within:ring-ring/50 flex h-9 w-[176px] items-center rounded-[10px] border bg-card px-4 shadow-xs focus-within:ring-[3px]"
			>
				<input
					type="number"
					min="1"
					placeholder="60"
					class="text-foreground w-full min-w-0 flex-1 [appearance:textfield] bg-transparent text-right text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
					value={settings.test_timings.value.time_limit ?? ''}
					oninput={(e) => {
						const v = (e.currentTarget as HTMLInputElement).valueAsNumber;
						settings.test_timings.value.time_limit = Number.isFinite(v) ? v : null;
					}}
				/>
				<span class="ml-2 text-sm whitespace-nowrap">minutes</span>
			</label>
		</div>

		<div class="flex items-center justify-between gap-4">
			<span class="text-sm font-semibold text-muted-foreground">
				Start time for the {term('test', 'lower')}
			</span>
			<TimePickerPill bind:value={settings.test_timings.value.start_time} />
		</div>

		<div class="flex items-center justify-between gap-4">
			<span class="text-sm font-semibold text-muted-foreground">
				End time for the {term('test', 'lower')}
			</span>
			<TimePickerPill bind:value={settings.test_timings.value.end_time} />
		</div>
	</div>
</FeatureCard>
