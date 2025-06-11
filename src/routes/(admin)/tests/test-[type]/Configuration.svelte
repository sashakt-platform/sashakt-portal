<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Info from '@lucide/svelte/icons/info';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import ClipboardPenLine from '@lucide/svelte/icons/clipboard-pen-line';
	import Timer from '@lucide/svelte/icons/timer';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import ConfigureBox from './ConfigureBox.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';

	let { formData } = $props();
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
						name="start_instructions"
						placeholder="Enter your instructions here..."
						bind:value={$formData.start_instructions}
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
						name="completion_message"
						placeholder="Enter your instructions here..."
						bind:value={$formData.completion_message}
					/>
				</div>
			</div>
		</ConfigureBox>

		<ConfigureBox title="Timer Settings" Icon={Timer} hidden={$formData.is_template}>
			<div class="flex flex-row">
				<div class="my-auto w-2/5 align-middle">
					{@render headingSubheading('Start & end time', 'Set the start and end time of the test')}
				</div>
				<div class=" flex w-3/5 flex-row gap-4">
					<div class="flex w-1/2 flex-col gap-2">
						<Label for="dateStart" class="my-auto font-extralight">Start Time</Label>
						<Input
							type="datetime-local"
							id="dateStart"
							name="start_time"
							bind:value={$formData.start_time}
						/>
					</div>
					<div class="flex w-1/2 flex-col gap-2">
						<Label for="dateEnd" class="my-auto font-extralight">End Time</Label>
						<Input
							type="datetime-local"
							id="dateEnd"
							name="end_time"
							bind:value={$formData.end_time}
						/>
					</div>
				</div>
			</div>

			<div class="flex flex-row">
				<div class="w-2/5">
					{@render headingSubheading('Time limit', 'Set the maximum time allowed for the test')}
				</div>
				<div class=" flex w-3/5 flex-row gap-4">
					<Input
						placeholder="Enter in Minutes..."
						class="w-1/2"
						type="number"
						name="time_limit"
						bind:value={$formData.time_limit}
					/>
				</div>
			</div>
		</ConfigureBox>
		<ConfigureBox title="Question settings" Icon={CircleHelp}>
			<div class="flex flex-col gap-6">
				{#snippet checkboxLabel(name: string, label: string, subLabel: string)}
					<div class="flex w-2/5 items-center space-x-2">
						<Checkbox id={name} {name} onCheckedChange={(value) => ($formData[name] = value)} />
						<Label for={name} class="ml-2">
							{@render headingSubheading(label, subLabel)}
						</Label>
					</div>
				{/snippet}
				<span hidden
					>{@render checkboxLabel(
						'shuffle',
						'Shuffle',
						'Shuffle the selected questions in the test'
					)}</span
				>
				<div class="flex flex-row" hidden>
					{@render checkboxLabel(
						'random_questions',
						'Randomize',
						'Add random questions to test based on selected tags and location'
					)}
					{#if $formData.random_questions}
						<div class="my-auto ml-4 w-1/2">
							<Input
								placeholder="Enter total Expected Random Questions."
								class="w-full"
								type="number"
								name="no_of_random_questions"
								bind:value={$formData.no_of_random_questions}
							/>
							<small class="text-red-400">Random Questions Count should be greater than 0</small>
						</div>
					{/if}
				</div>

				<div class="flex flex-row pt-6">
					<div class="w-1/2">
						{@render headingSubheading(
							'Question Pagination',
							'Set the maximum number of questions per screen'
						)}
					</div>
					<div class=" flex w-1/2 flex-row gap-4">
						<Input
							placeholder="Enter Count of Questions"
							type="number"
							name="question_pagination"
							bind:value={$formData.question_pagination}
						/>
					</div>
				</div>
			</div>
		</ConfigureBox>
		<!-- 
		
		<ConfigureBox title="Test settings" Icon={ClipboardPenLine}>
			<div class="flex flex-row">
				<div class="my-auto w-2/5 align-middle">
					{@render headingSubheading('Marks Level', 'Set the level of marks for the test')}
				</div>
				<div class=" flex w-3/5 flex-row gap-4"></div>
			</div>
		</ConfigureBox> -->
	</div>
</div>
