<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import FeatureCard from '../FeatureCard.svelte';
	import type { OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<FeatureCard
	title="Test Timings"
	description="Set when the test starts and how long candidates have to complete it"
	bind:mode={settings.test_timings.mode}
>
	<div class="flex flex-col gap-5">
		<div class="flex items-center justify-between gap-4">
			<span class="text-sm font-medium">Maximum time limit for the test</span>
			<div class="relative w-56">
				<Input
					type="number"
					min="1"
					placeholder="60"
					class="pr-20 text-right"
					value={settings.test_timings.value.time_limit ?? ''}
					oninput={(e) => {
						const v = (e.currentTarget as HTMLInputElement).valueAsNumber;
						settings.test_timings.value.time_limit = Number.isFinite(v) ? v : null;
					}}
				/>
				<span class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
					minutes
				</span>
			</div>
		</div>

		<div class="flex items-center justify-between gap-4">
			<span class="text-sm font-medium">Start time for the test</span>
			<Input
				type="time"
				class="w-56"
				value={settings.test_timings.value.start_time ?? ''}
				oninput={(e) => {
					const v = (e.currentTarget as HTMLInputElement).value;
					settings.test_timings.value.start_time = v || null;
				}}
			/>
		</div>

		<div class="flex items-center justify-between gap-4">
			<span class="text-sm font-medium">End time for the test</span>
			<Input
				type="time"
				class="w-56"
				value={settings.test_timings.value.end_time ?? ''}
				oninput={(e) => {
					const v = (e.currentTarget as HTMLInputElement).value;
					settings.test_timings.value.end_time = v || null;
				}}
			/>
		</div>
	</div>
</FeatureCard>
