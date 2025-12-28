<script lang="ts">
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import TimePicker from '$lib/components/TimePicker.svelte';
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

	// Format time for display in 12-hour format
	function formatTimeDisplay(time: string): string {
		const [h, m] = time.split(':').map(Number);
		const period = h >= 12 ? 'PM' : 'AM';
		let hour12 = h % 12;
		if (hour12 === 0) hour12 = 12;
		return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
	}

	// Format full datetime for button display
	function formatButtonDisplay(date: CalendarDate | undefined, time: string): string {
		if (!date) return 'Select date & time';
		const dateStr = date.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
		return `${dateStr}, ${formatTimeDisplay(time)}`;
	}
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
	<div class="flex flex-1 flex-col gap-2">
		<Label for="{id}-from" class="px-1">{rangeFromLabel}</Label>
		<Popover.Root bind:open={rangeFromOpen}>
			<Popover.Trigger id="{id}-from">
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="w-full justify-between font-normal">
						{formatButtonDisplay(rangeFromDateValue, rangeFromTimeValue)}
						<ChevronDownIcon />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto p-0" align="start">
				<Calendar
					type="single"
					bind:value={rangeFromDateValue}
					captionLayout="dropdown"
					onValueChange={updateFromValue}
				/>
				<div class="border-t p-3">
					<TimePicker bind:value={rangeFromTimeValue} onchange={updateFromValue} />
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
	<div class="flex flex-1 flex-col gap-2">
		<Label for="{id}-to" class="px-1">{rangeToLabel}</Label>
		<Popover.Root bind:open={rangeToOpen}>
			<Popover.Trigger id="{id}-to">
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="w-full justify-between font-normal">
						{formatButtonDisplay(rangeToDateValue, rangeToTimeValue)}
						<ChevronDownIcon />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto p-0" align="start">
				<Calendar
					type="single"
					bind:value={rangeToDateValue}
					captionLayout="dropdown"
					onValueChange={updateToValue}
					isDateDisabled={(date: CalendarDate) => {
						return (rangeFromDateValue && date.compare(rangeFromDateValue) < 0) ?? false;
					}}
				/>
				<div class="border-t p-3">
					<TimePicker bind:value={rangeToTimeValue} onchange={updateToValue} />
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>
