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
	import CalendarRange from '$lib/components/CalendarRange.svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { MarksLevel } from './schema';
	import * as Select from '$lib/components/ui/select';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';

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

	if (!$formData.locale) {
		$formData.locale = 'en-US';
	}

	let languageOptions = $state<{ [key: string]: string }>({});
	let certificatesOptions = $state<Array<{ id: number; name: string | null }>>([]);
	let formsOptions = $state<Array<{ id: number; name: string; description: string | null }>>([]);

	// load test languages
	async function loadLanguages() {
		try {
			const response = await fetch('/api/languages');
			if (response.ok) {
				const data = await response.json();
				languageOptions = data;
			}
		} catch (error) {
			console.error('Failed to load test languages:', error);
		}
	}

	async function loadForms() {
		try {
			const response = await fetch('/api/forms');

			if (response.ok) {
				const data = await response.json();
				formsOptions = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to load forms:', error);
			formsOptions = [];
		}
	}

	async function loadCertificates() {
		try {
			const response = await fetch('/api/certificates');

			if (response.ok) {
				const data = await response.json();
				certificatesOptions = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to load certificates:', error);
			certificatesOptions = [];
		}
	}

	// initial load effect
	$effect(() => {
		loadLanguages();
		loadForms();
		loadCertificates();
	});
</script>

<div class="mx-auto flex h-dvh overflow-auto">
	<div class="mx-4 mt-6 flex w-full flex-col sm:mx-6 md:mx-10 md:mt-10">
		{#snippet headingSubheading(heading: string, subheading: string)}
			<p class="font-bold">{heading}</p>
			<p class="text-sm font-extralight">
				{subheading}
			</p>
		{/snippet}

		<ConfigureBox title="Instructions" Icon={Info}>
			<div class={['flex flex-col gap-4 py-6 md:flex-row md:gap-0 md:py-8', 'border-b-1']}>
				<div class="w-full md:w-2/5">
					{@render headingSubheading(
						'Pre-test guidelines',
						'Instructions displayed before attempting the test.'
					)}
				</div>
				<div class="w-full md:w-3/5">
					<Textarea
						name="start_instructions"
						placeholder=""
						bind:value={$formData.start_instructions}
					/>
				</div>
			</div>
			<div class={['flex flex-col gap-4 py-6 md:flex-row md:gap-0 md:py-8']}>
				<div class="w-full md:w-2/5">
					{@render headingSubheading(
						'Completion message',
						'Message displayed after test completion.'
					)}
				</div>
				<div class="w-full md:w-3/5">
					<Textarea
						name="completion_message"
						placeholder=""
						bind:value={$formData.completion_message}
					/>
				</div>
			</div>
		</ConfigureBox>

		<ConfigureBox title="Timer Settings" Icon={Timer}>
			<div class="flex flex-col gap-4 md:flex-row md:gap-0" hidden={$formData.is_template}>
				<div class="my-auto w-full align-middle md:w-2/5">
					{@render headingSubheading(
						'Test Schedule',
						'Set the date and time when the test will be available.'
					)}
				</div>
				<div class="flex w-full flex-col gap-4 sm:flex-row md:w-3/5">
					<CalendarRange
						rangeFromLabel="Start Time"
						bind:rangeFromValue={$formData.start_time}
						rangeToLabel="End Time"
						bind:rangeToValue={$formData.end_time}
					/>
				</div>
			</div>

			<div class="flex flex-col gap-4 md:flex-row md:gap-0">
				<div class="w-full md:w-2/5">
					{@render headingSubheading(
						'Time limit',
						'Set the maximum duration allowed to complete the test.'
					)}
				</div>
				<div class="flex w-full flex-row gap-4 md:w-3/5">
					<Input
						placeholder="Enter in Minutes..."
						class="w-full sm:w-1/2"
						type="number"
						name="time_limit"
						bind:value={$formData.time_limit}
					/>
				</div>
			</div>
		</ConfigureBox>
		<ConfigureBox title="Question settings" Icon={CircleHelp}>
			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-4 pt-6 md:flex-row md:pt-10">
					<div class="w-full md:w-1/2">
						{@render headingSubheading(
							'Questions Per Page',
							"Enter the number of questions to display on each page. Enter '0' to show all questions on a single page."
						)}
					</div>
					<div class="flex w-full flex-row gap-4 md:w-1/2">
						<Input
							placeholder=""
							type="number"
							name="question_pagination"
							bind:value={$formData.question_pagination}
							class="w-full"
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
						'Choose whether to display the test results after completion.'
					)}
				</div>
			</div>
			<div class="flex flex-row gap-3 align-top">
				<div class="my-auto w-fit gap-4">
					<Checkbox bind:checked={$formData.show_question_palette} />
				</div>
				<div class="w-full">
					{@render headingSubheading(
						'Show Question Palette',
						'Choose whether to display the Question Palette during the test.'
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
							'Choose whether to shuffle the selected questions during the test.'
						)}
					</div>
				</div>

				<div class="flex flex-col gap-3 align-top md:flex-row">
					<div class="flex flex-row gap-3">
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
						<div class="w-full md:w-auto">
							{@render headingSubheading(
								'Randomize Questions',
								'Specify the number of random questions to assign from the previously selected questions.'
							)}
						</div>
					</div>
					<div class="my-auto flex w-full flex-col md:w-1/2">
						<Input
							type="number"
							id="random_count"
							name="no_of_random_questions"
							placeholder=""
							hidden={!$formData.random_questions}
							bind:value={$formData.no_of_random_questions}
						/>
						{#if $formData.random_questions && $formData.no_of_random_questions <= 0}
							<small class="mt-1 text-red-400">Enter a positive integer</small>
						{:else if $formData.random_questions && $formData.no_of_random_questions > 0 && $formData.question_revision_ids.length < $formData.no_of_random_questions}
							<small class="mt-1 text-red-400">
								Number of random questions cannot exceed the total number of questions selected.
							</small>
						{/if}
					</div>
				</div>
			{/if}
			<div class="w-full md:w-2/5">
				{@render headingSubheading('Feedback Setting', '')}
			</div>
			<div class="flex flex-row gap-3 align-top">
				<div class="my-auto w-fit gap-4">
					<Checkbox bind:checked={$formData.show_feedback_on_completion} />
				</div>
				<div class="w-full">
					{@render headingSubheading(
						'Feedback on Completion',
						'Enable to show candidate their answers and correct answers after the test is completed.'
					)}
				</div>
			</div>

			<div class="mt-4 flex flex-row gap-3 align-top">
				<div class="my-auto w-fit gap-4">
					<Checkbox bind:checked={$formData.show_feedback_immediately} />
				</div>
				<div class="w-full">
					{@render headingSubheading(
						'Immediate Feedback',
						'Enable to show candidate correct answers immediately after each question is attempted.'
					)}
				</div>
			</div>
			<div class="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
				<div>
					{@render headingSubheading('Language', 'Select test language.')}
				</div>
				<div>
					<Select.Root type="single" name="locale" bind:value={$formData.locale}>
						<Select.Trigger class="w-48">{languageOptions[$formData.locale]}</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each Object.entries(languageOptions) as [key, label] (key)}
									<Select.Item value={key} {label}>{label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</ConfigureBox>

		<ConfigureBox title="Marks Setting" Icon={ClipboardPenLine}>
			<div class="flex flex-col gap-6 pt-6 md:flex-row md:gap-8 md:pt-10">
				<RadioGroup.Root
					bind:value={$formData.marks_level}
					class="flex w-full flex-col gap-6 md:gap-8"
				>
					<div class="flex w-full items-center space-x-2">
						<RadioGroup.Item value={MarksLevel.QUESTION} id="question_level" />
						<Label for="question_level"
							>{@render headingSubheading(
								'Question Level Marking Scheme',
								'Assign marks individually for each question in the test.'
							)}</Label
						>
					</div>
					<div class="flex w-full flex-col gap-4 md:flex-row md:items-center">
						<div class="flex w-full flex-row items-center space-x-2 md:w-1/2">
							<RadioGroup.Item value={MarksLevel.TEST} id="test_level" />
							<Label for="test_level"
								>{@render headingSubheading(
									'Test Level Marking Scheme',
									'Assign the same marks to all questions in the test.'
								)}</Label
							>
						</div>
						<div
							class="flex w-full flex-col gap-1 md:w-1/2"
							hidden={$formData.marks_level !== 'test'}
						>
							<small class="text-gray-500">Marks for Correct Answer (Test Level)</small>
							<Input
								class="flex w-full"
								type="number"
								placeholder=""
								name="marking_scheme.correct"
								bind:value={$formData.marking_scheme.correct}
							/>
						</div>
					</div>
				</RadioGroup.Root>
			</div>
		</ConfigureBox>
		<ConfigureBox title="Candidate Profile" Icon={ClipboardPenLine}>
			<div class="flex flex-row gap-3 align-top">
				<div class="my-auto w-fit gap-4">
					<Checkbox
						bind:checked={$formData.candidate_profile}
						onCheckedChange={(checked: boolean) => {
							if (!checked) {
								$formData.form_id = null;
							}
						}}
					/>
				</div>
				<div class="w-full">
					{@render headingSubheading(
						'Candidate profile',
						'Enable this option to collect candidate information during the test.'
					)}
				</div>
			</div>

			{#if $formData.candidate_profile}
				<div class="mt-4 flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center">
					<div class="w-full md:w-2/5">
						{@render headingSubheading(
							'Select Form',
							'Choose a form to collect candidate information before the test.'
						)}
					</div>

					<div class="flex items-center gap-2">
						<Select.Root type="single" name="form_id" bind:value={$formData.form_id}>
							<Select.Trigger class="w-72">
								<span class="truncate">
									{#if $formData.form_id}
										{formsOptions.find((f) => f.id === $formData.form_id)?.name}
									{:else}
										Select form
									{/if}
								</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Item value={null} label="No form">No form</Select.Item>

									{#each formsOptions as form (form.id)}
										<Select.Item value={form.id}>
											{form.name}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>

						<a
							href="/forms/add/new"
							target="_blank"
							class="text-primary text-sm whitespace-nowrap hover:underline"
						>
							Create new form
						</a>
					</div>
				</div>
			{/if}
		</ConfigureBox>
		<ConfigureBox title="Certificate Settings" Icon={ShieldCheck}>
			<div class="flex flex-col gap-4 pt-6 md:flex-row md:items-center">
				<div class="w-full md:w-2/5">
					{@render headingSubheading(
						'Attach Certificate',
						'Select a certificate to issue after test completion.'
					)}
				</div>

				<Select.Root type="single" name="certificate_id" bind:value={$formData.certificate_id}>
					<Select.Trigger class="w-72">
						<span class="truncate">
							{#if $formData.certificate_id}
								{certificatesOptions.find((c) => c.id === $formData.certificate_id)?.name}
							{:else}
								Select certificate
							{/if}
						</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Item value={null} label="No certificate">No certificate</Select.Item>

							{#each certificatesOptions as cert (cert.id)}
								<Select.Item value={cert.id}>
									{cert.name}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</ConfigureBox>
	</div>
</div>
