<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Info from '@lucide/svelte/icons/info';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Timer from '@lucide/svelte/icons/timer';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import ConfigureBox from './ConfigureBox.svelte';
	import Clock4 from '@lucide/svelte/icons/clock-4';
	import Input from '$lib/components/ui/input/input.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	let { testData = $bindable() } = $props();
</script>

<div class="mx-auto flex h-dvh overflow-auto">
	<div class="mx-auto mt-10 flex w-1/2 flex-col">
		{#snippet headingSubheading(heading: string, subheading: string)}
			<p class="font-bold">{heading}</p>
			<p class="text-sm font-extralight">
				{subheading}
			</p>
		{/snippet}

		<ConfigureBox title="Instructions" Icon={Info}>
			<div class={['flex flex-row py-8', 'border-b-1']}>
				<div class="w-2/5">
					{@render headingSubheading(
						'Pre-test guidelines',
						'Detailed instructions before attempting the test'
					)}
				</div>
				<div class="w-3/5">
					<Textarea
						placeholder="Enter your instructions here..."
						bind:value={testData.start_instructions}
					/>
				</div>
			</div>
			<div class={['flex flex-row py-8']}>
				<div class="w-2/5">
					{@render headingSubheading(
						'Completion message',
						'Message content after the test completion'
					)}
				</div>
				<div class="w-3/5">
					<Textarea
						placeholder="Enter your instructions here..."
						bind:value={testData.completion_message}
					/>
				</div>
			</div>
		</ConfigureBox>

		<ConfigureBox title="Timer Settings" Icon={Timer}>
			<div class="flex flex-row">
				<div class="my-auto w-2/5 align-middle">
					{@render headingSubheading('Start & end time', 'Set the start and end time of the test')}
				</div>
				<div class=" flex w-3/5 flex-row gap-4">
					<div class="flex w-1/2 flex-col gap-2">
						<Label for="dateStart" class="my-auto font-extralight">Start Time</Label>
						<Input type="datetime-local" id="dateStart" bind:value={testData.start_time} />
					</div>
					<div class="flex w-1/2 flex-col gap-2">
						<Label for="dateEnd" class="my-auto font-extralight">End Time</Label>
						<Input type="datetime-local" id="dateEnd" bind:value={testData.end_time} />
					</div>
				</div>
			</div>

			<div class="flex flex-row">
				<div class="w-2/5">
					{@render headingSubheading('Time limit', 'Set the maximum time allowed for the test')}
				</div>
				<div class=" flex w-3/5 flex-row gap-4">
					<Input placeholder="Enter in Minutes..." class="w-1/2" type="number" bind:value={testData.time_limit} />
				</div>
			</div>
		</ConfigureBox>
		<ConfigureBox title="Question settings" Icon={CircleHelp}>
			<div class="flex flex-col gap-6">
				{#snippet checkboxLabel(name: string, label: string, subLabel: string)}
					<div class="flex w-2/5 items-center space-x-2">
						<Checkbox id={name} />
						<Label for={name} class="ml-2">
							{@render headingSubheading(label, subLabel)}
						</Label>
					</div>
				{/snippet}
				{@render checkboxLabel('pointsCheckBox', 'Points', 'Display points for each question')}
				{@render checkboxLabel('tagsCheckBox', 'Tags', 'Display the tags for each questions')}
				{@render checkboxLabel(
					'randomCheckBox',
					'Randomize',
					'Add random questions to test based on selected tags'
				)}
			</div>
		</ConfigureBox>
	</div>
</div>
