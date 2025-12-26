<script lang="ts">
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { CalendarDate, getLocalTimeZone } from '@internationalized/date';

	const id = $props.id();

	let {
		rangeFromValue = $bindable<string | null | undefined>(undefined),
		rangeToValue = $bindable<string | null | undefined>(undefined),
		rangeFromLabel = 'From',
		rangeToLabel = 'To'
	} = $props();

	let rangeFromOpen = $state(false);
	let rangeToOpen = $state(false);
	let rangeFromDateValue = $state<CalendarDate | undefined>();
	let rangeToDateValue = $state<CalendarDate | undefined>();
	let rangeFromTimeValue = $state('00:00');
	let rangeToTimeValue = $state('00:00');

	// Parse datetime string from backedn into CalendarDate and time string
	function parseDatetime(value: string | null | undefined): {
		date: CalendarDate | undefined;
		time: string;
	} {
		if (!value) return { date: undefined, time: '00:00' };
		try {
			const dt = new Date(value);
			if (isNaN(dt.getTime())) {
				return { date: undefined, time: '00:00' };
			}

			const date = new CalendarDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
			const time = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;

			return { date, time };
		} catch {
			return { date: undefined, time: '00:00' };
		}
	}

	// Combine CalendarDate and time string into ISO datetime string for api endpoint
	function formatDatetime(date: CalendarDate | undefined, time: string): string | undefined {
		if (!date) return undefined;
		const [hours, minutes] = time.split(':').map(Number);
		const dt = date.toDate(getLocalTimeZone());
		dt.setHours(hours || 0, minutes || 0, 0, 0);
		return dt.toISOString();
	}

	// Set defaults for dates based on props
	$effect(() => {
		const fromParsed = parseDatetime(rangeFromValue);
		if (
			!rangeFromDateValue ||
			(fromParsed.date && rangeFromDateValue.compare(fromParsed.date) !== 0)
		) {
			rangeFromDateValue = fromParsed.date;
			rangeFromTimeValue = fromParsed.time;
		}

		const toParsed = parseDatetime(rangeToValue);
		if (!rangeToDateValue || (toParsed.date && rangeToDateValue.compare(toParsed.date) !== 0)) {
			rangeToDateValue = toParsed.date;
			rangeToTimeValue = toParsed.time;
		}
	});

	// Sync internal state back to props
	function updateFromValue() {
		rangeFromValue = formatDatetime(rangeFromDateValue, rangeFromTimeValue);
	}

	function updateToValue() {
		rangeToValue = formatDatetime(rangeToDateValue, rangeToTimeValue);
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex gap-4">
		<div class="flex flex-1 flex-col gap-3">
			<Label for="{id}-date-from" class="px-1">{rangeFromLabel}</Label>
			<Popover.Root bind:open={rangeFromOpen}>
				<Popover.Trigger id="{id}-date-from">
					{#snippet child({ props })}
						<Button {...props} variant="outline" class="w-full justify-between font-normal">
							{rangeFromDateValue
								? rangeFromDateValue.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
										day: '2-digit',
										month: 'short',
										year: 'numeric'
									})
								: 'Select date'}
							<ChevronDownIcon />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto overflow-hidden p-0" align="start">
					<Calendar
						type="single"
						bind:value={rangeFromDateValue}
						captionLayout="dropdown"
						onValueChange={() => {
							rangeFromOpen = false;
							updateFromValue();
						}}
					/>
				</Popover.Content>
			</Popover.Root>
		</div>
		<div class="flex flex-col gap-3">
			<Label for="{id}-time-from" class="invisible px-1">From</Label>
			<Input
				type="time"
				id="{id}-time-from"
				bind:value={rangeFromTimeValue}
				onchange={updateFromValue}
				class="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
			/>
		</div>
	</div>
	<div class="flex gap-4">
		<div class="flex flex-1 flex-col gap-3">
			<Label for="{id}-date-to" class="px-1">{rangeToLabel}</Label>
			<Popover.Root bind:open={rangeToOpen}>
				<Popover.Trigger id="{id}-date-to">
					{#snippet child({ props })}
						<Button {...props} variant="outline" class="w-full justify-between font-normal">
							{rangeToDateValue
								? rangeToDateValue.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
										day: '2-digit',
										month: 'short',
										year: 'numeric'
									})
								: 'Select date'}
							<ChevronDownIcon />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto overflow-hidden p-0" align="start">
					<Calendar
						type="single"
						bind:value={rangeToDateValue}
						captionLayout="dropdown"
						onValueChange={() => {
							rangeToOpen = false;
							updateToValue();
						}}
						isDateDisabled={(date: CalendarDate) => {
							return (rangeFromDateValue && date.compare(rangeFromDateValue) < 0) ?? false;
						}}
					/>
				</Popover.Content>
			</Popover.Root>
		</div>
		<div class="flex flex-col gap-3">
			<Label for="{id}-time-to" class="invisible px-1">To</Label>
			<Input
				type="time"
				id="{id}-time-to"
				bind:value={rangeToTimeValue}
				onchange={updateToValue}
				class="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
			/>
		</div>
	</div>
</div>
