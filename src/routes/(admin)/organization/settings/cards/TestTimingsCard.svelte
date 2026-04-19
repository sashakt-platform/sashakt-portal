<script lang="ts">
	import FeatureCard from '../FeatureCard.svelte';
	import TimePickerPill from '../TimePickerPill.svelte';
	import type { OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="Test Timings"
	description="Set when the test starts and how long candidates have to complete it"
	bind:mode={settings.test_timings.mode}
>
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-4">
			<span class="text-foreground text-sm font-semibold">Maximum time limit for the test</span>
			<label
				class="border-input focus-within:border-ring focus-within:ring-ring/50 flex h-11 w-64 items-center rounded-full border bg-white px-5 shadow-xs focus-within:ring-[3px]"
			>
				<input
					type="number"
					min="1"
					placeholder="60"
					class="text-foreground flex-1 [appearance:textfield] bg-transparent text-right text-sm font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
					value={settings.test_timings.value.time_limit ?? ''}
					oninput={(e) => {
						const v = (e.currentTarget as HTMLInputElement).valueAsNumber;
						settings.test_timings.value.time_limit = Number.isFinite(v) ? v : null;
					}}
				/>
				<span class="text-muted-foreground ml-3 text-sm">minutes</span>
			</label>
		</div>

		<div class="flex items-center justify-between gap-4">
			<span class="text-foreground text-sm font-semibold">Start time for the test</span>
			<TimePickerPill bind:value={settings.test_timings.value.start_time} />
		</div>

		<div class="flex items-center justify-between gap-4">
			<span class="text-foreground text-sm font-semibold">End time for the test</span>
			<TimePickerPill bind:value={settings.test_timings.value.end_time} />
		</div>
	</div>
</FeatureCard>
