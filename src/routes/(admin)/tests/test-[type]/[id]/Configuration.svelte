<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import Timer from '@lucide/svelte/icons/timer';
	import ClipboardPenLine from '@lucide/svelte/icons/clipboard-pen-line';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import ConfigureBox from './ConfigureBox.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { MarksLevel } from './schema';

	let { formData } = $props();

	if (!$formData.marking_scheme) {
		$formData.marking_scheme = {
			correct: 1,
			wrong: 0,
			skipped: 0
		};
	}

	if (!$formData.marks_level) {
		$formData.marks_level = MarksLevel.QUESTION;
	}
</script>

<div class="mx-auto flex h-dvh overflow-auto">
	<div class="mx-10 mt-10 flex w-full flex-col">
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

		<ConfigureBox title="Timer Settings" Icon={Timer}>
			<div class="flex flex-row" hidden={$formData.is_template}>
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
				<div class="flex flex-row gap-4 pt-10">
					<div class="w-1/2">
						{@render headingSubheading(
							'Questions Per Page',
							"Enter the number of questions to display per page. Enter '0' to display all questions on a single page"
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

		<ConfigureBox title="Test settings" Icon={ClipboardPenLine}>
			<div class="flex flex-row gap-3 align-top">
				<div class="my-auto w-fit gap-4"><Checkbox bind:checked={$formData.show_result} /></div>
				<div class="w-full">
					{@render headingSubheading(
						'Show Result',
						'Configure if results should be shown post test completion'
					)}
				</div>
			</div>
			{#if $formData.random_tag_count.length == 0}
				<div class="flex flex-row gap-3 align-top">
					<div class="my-auto w-fit gap-4">
						<Checkbox
							bind:checked={$formData.shuffle}
							onCheckedChange={(checked: boolean) => {
								if (checked) {
									$formData.random_questions = false;
									$formData.no_of_random_questions = 0;
								}
							}}
						/>
					</div>
					<div class="w-full">
						{@render headingSubheading(
							'Shuffle Questions',
							'Configure if selected questions should be shuffled during the test'
						)}
					</div>
				</div>

				<div class="flex flex-row gap-3 align-top">
					<div class="my-auto w-fit gap-4">
						<Checkbox
							bind:checked={$formData.random_questions}
							onCheckedChange={(checked: boolean) => {
								if (checked) {
									$formData.shuffle = false;
								} else {
									$formData.no_of_random_questions = 0;
								}
							}}
						/>
					</div>
					<div class="w-1/2">
						{@render headingSubheading(
							'Randomize Questions',
							'Set the number of random questions to assign from the earlier selected questions.'
						)}
					</div>
					<div class="gap- my-auto flex w-1/2 flex-col">
						<Input
							type="number"
							id="random_count"
							name="no_of_random_questions"
							placeholder="Enter total random questions required"
							hidden={!$formData.random_questions}
							bind:value={$formData.no_of_random_questions}
						/>
						{#if $formData.random_questions && $formData.no_of_random_questions <= 0}
							<small class="mt-1 text-red-400">Enter a positive integer</small>
						{:else if $formData.random_questions && $formData.no_of_random_questions > 0 && $formData.question_revision_ids.length < $formData.no_of_random_questions}
							<small class="mt-1 text-red-400">
								Number of random questions cannot exceed the total number of questions selected
							</small>
						{/if}
					</div>
				</div>
			{/if}
		</ConfigureBox>

		<ConfigureBox title="Marks Setting" Icon={ClipboardPenLine}>
			<div class="flex flex-row gap-8 pt-10">
				<RadioGroup.Root bind:value={$formData.marks_level} class="flex w-full flex-col  gap-8">
					<div class="b flex w-full items-center space-x-2">
						<RadioGroup.Item value={MarksLevel.QUESTION} id="question_level" />
						<Label for="question_level"
							>{@render headingSubheading(
								'Question Level Marking Scheme',
								'Set Marks Individually (per question) for each question of the test'
							)}</Label
						>
					</div>
					<div class="flex w-full flex-row items-center gap-4">
						<div class="flex w-1/2 flex-row items-center space-x-2">
							<RadioGroup.Item value={MarksLevel.TEST} id="test_level" />
							<Label for="test_level"
								>{@render headingSubheading(
									'Test Level Marking Scheme',
									'Set uniform Marks for all the questions in the test'
								)}</Label
							>
						</div>
						<div class="flex w-1/2 flex-col gap-1" hidden={$formData.marks_level !== 'test'}>
							<small class="text-gray-500">Marks for Correct Answer at Test Level</small>
							<Input
								class="flex w-full"
								type="number"
								placeholder="Enter Marks for Correct Answer"
								name="marking_scheme.correct"
								bind:value={$formData.marking_scheme.correct}
							/>
						</div>
					</div>
				</RadioGroup.Root>
			</div>
		</ConfigureBox>
	</div>
</div>
