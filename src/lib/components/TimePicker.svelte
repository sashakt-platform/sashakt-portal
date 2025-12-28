<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';

	let {
		value = $bindable('12:00'),
		onchange
	}: {
		value?: string;
		onchange?: () => void;
	} = $props();

	// Internal state in 12-hour format
	let hour = $state('12');
	let minute = $state('00');
	let period = $state<'AM' | 'PM'>('AM');

	// Convert 24-hour time string to 12-hour components
	function parse24HourTime(time: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
		const [h, m] = time.split(':').map(Number);
		const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
		let hour12 = h % 12;
		if (hour12 === 0) hour12 = 12;
		return {
			hour: String(hour12).padStart(2, '0'),
			minute: String(m).padStart(2, '0'),
			period: p
		};
	}

	// Convert 12-hour components to 24-hour time string
	function to24HourTime(h: string, m: string, p: 'AM' | 'PM'): string {
		let hour24 = parseInt(h, 10);
		if (p === 'AM' && hour24 === 12) hour24 = 0;
		else if (p === 'PM' && hour24 !== 12) hour24 += 12;
		return `${String(hour24).padStart(2, '0')}:${m}`;
	}

	// Initialize from value prop
	$effect(() => {
		if (value) {
			const parsed = parse24HourTime(value);
			hour = parsed.hour;
			minute = parsed.minute;
			period = parsed.period;
		}
	});

	// Update value when any component changes
	function updateValue() {
		value = to24HourTime(hour, minute, period);
		onchange?.();
	}

	const hours = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
	const minutes = ['00', '15', '30', '45'];
	const periods: ('AM' | 'PM')[] = ['AM', 'PM'];
</script>

<div class="flex gap-1">
	<Select.Root
		type="single"
		value={hour}
		onValueChange={(v) => {
			if (v) {
				hour = v;
				updateValue();
			}
		}}
	>
		<Select.Trigger class="w-[70px]">
			{hour}
		</Select.Trigger>
		<Select.Content>
			{#each hours as h}
				<Select.Item value={h}>{h}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<span class="text-muted-foreground flex items-center">:</span>

	<Select.Root
		type="single"
		value={minute}
		onValueChange={(v) => {
			if (v) {
				minute = v;
				updateValue();
			}
		}}
	>
		<Select.Trigger class="w-[70px]">
			{minute}
		</Select.Trigger>
		<Select.Content>
			{#each minutes as m}
				<Select.Item value={m}>{m}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<Select.Root
		type="single"
		value={period}
		onValueChange={(v) => {
			if (v) {
				period = v as 'AM' | 'PM';
				updateValue();
			}
		}}
	>
		<Select.Trigger class="w-[70px]">
			{period}
		</Select.Trigger>
		<Select.Content>
			{#each periods as p}
				<Select.Item value={p}>{p}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
