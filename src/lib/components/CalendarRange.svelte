<script lang="ts">
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import TimePicker from '$lib/components/TimePicker.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { CalendarDate } from '@internationalized/date';

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

	// Parse datetime string from backend into CalendarDate and time string
	// Backend format: "2025-12-31 17:30:00"
	function parseDatetime(value: string | null | undefined): {
		date: CalendarDate | undefined;
		time: string;
	} {
		if (!value) return { date: undefined, time: '00:00' };
		try {
			const normalized = value.replace('T', ' ');
			const [datePart, timePart] = normalized.split(' ');
			const [year, month, day] = datePart.split('-').map(Number);

			if (!year || !month || !day) {
				return { date: undefined, time: '00:00' };
			}

			const date = new CalendarDate(year, month, day);

			let time = '00:00';
			if (timePart) {
				const [hours, minutes] = timePart.split(':').map(Number);
				time = `${String(hours || 0).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`;
			}

			return { date, time };
		} catch {
			return { date: undefined, time: '00:00' };
		}
	}

	// Combine CalendarDate and time string into datetime string for api endpoint
	function formatDatetime(date: CalendarDate | undefined, time: string): string | undefined {
		if (!date) return undefined;
		const [hours, minutes] = time.split(':').map(Number);
		const year = date.year;
		const month = String(date.month).padStart(2, '0');
		const day = String(date.day).padStart(2, '0');
		const h = String(hours || 0).padStart(2, '0');
		const m = String(minutes || 0).padStart(2, '0');
		return `${year}-${month}-${day} ${h}:${m}:00`;
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
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];
		const dateStr = `${months[date.month - 1]} ${String(date.day).padStart(2, '0')}, ${date.year}`;
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
