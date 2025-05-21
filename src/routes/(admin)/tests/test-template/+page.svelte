<script lang="ts">
	import EmptyBox from '$lib/components/first-data-box.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';
	import CircleChevronLeft from '@lucide/svelte/icons/circle-chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';

	import Button from '$lib/components/ui/button/button.svelte';

	import Primary from './Primary.svelte';
	import Question from './Question.svelte';

	const typeOfMode = { main: 0, primary: 1, questions: 2, settings: 3 };

	type modes = 'main' | 'primary' | 'questions' | 'settings';
	let currentMode: number = $state(typeOfMode.main);
	let testData = $state({
		name: 'Test Name',
		description: 'Test Description',
		start_time: '',
		end_time: '',
		time_limit: 1,
		marks_level: 'question',
		marks: 0,
		completion_message: '',
		start_instructions: '',
		link: '',
		no_of_attempts: 1,
		shuffle: false,
		random_questions: false,
		no_of_random_questions: 0,
		question_pagination: 1,
		is_template: false,
		template_id: 0,
		created_by_id: 0,
		tags: [],
		question_revision_ids: [],
		states: []
	});
	$effect(() =>
		currentMode == typeOfMode.main ? useSidebar().setOpen(true) : useSidebar().setOpen(false)
	);

	$effect(() => {
		// console.log(
		// 	'tags are ',
		// 	$state.snapshot(testData.tags),
		// 	' and states',
		// 	$state.snapshot(testData.states)
		// );

		console.log('questions are -->', $state.snapshot(testData.question_revision_ids));
	});
</script>

{#snippet myBadge(children: any)}
	<Badge variant="default" style={'background-color:#3587B4'} class="m-1 rounded-sm  p-2"
		>{children}</Badge
	>
{/snippet}

{#if currentMode !== typeOfMode.main}
	<div class="flex border-b-2 py-2">
		<div class="flex justify-start">
			<Button variant="link" class=" text-gray-500" onclick={() => (currentMode = typeOfMode.main)}
				><CircleChevronLeft />Back to test templates</Button
			>
		</div>
		<div class="mx-auto flex">
			{#snippet headerNumbers(
				number: number,
				text: string,
				mode: number,
				isCompleted: boolean = false
			)}
				{@const isActive = mode === currentMode}
				<Button
					variant="ghost"
					class={[
						'justify-left',
						isActive
							? 'border-primary text-primary border-1 font-bold'
							: isCompleted
								? 'text-primary'
								: '',
						'mx-4'
					]}
					onclick={() => {
						if (isCompleted) {
							currentMode = mode;
						}
					}}
					><span
						class={[
							isActive
								? 'bg-primary text-white'
								: isCompleted
									? 'text-primary border-primary border-1'
									: 'border-1 border-gray-600 text-gray-500',
							'mr-2 flex h-6 w-6 items-center justify-center rounded-full '
						]}>{number}</span
					>{text}</Button
				>
			{/snippet}
			{@render headerNumbers(
				1,
				'Primary Details',
				typeOfMode.primary,
				testData.name.trim() != '' && testData.description.trim() != ''
			)}
			<ChevronRight class="my-auto w-4" />
			{@render headerNumbers(2, 'Select Questions', typeOfMode.questions, false)}
			<ChevronRight class="my-auto w-4" />
			{@render headerNumbers(3, 'Configuration Settings', typeOfMode.settings, false)}
		</div>
	</div>
{/if}

{#if currentMode === typeOfMode.main}
	<div id="mainpage">
		<div class="mt-10 ml-10 flex w-full items-center align-middle">
			<span class="flex flex-row">
				<h2
					class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
				>
					Test templates
				</h2>
				<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
			</span>
		</div>
		<Label class="my-auto ml-10 align-middle text-sm font-extralight"
			>Create, edit and update all the tests</Label
		>

		<EmptyBox
			title="Create your first test template"
			subtitle="Click on create a test template to create test templates to be assigned"
			leftButton={{
				title: 'Create Template',
				link: '#',
				click: () => {
					console.log('Left button clicked');
					currentMode = typeOfMode.primary;
				}
			}}
			rightButton={null}
		/>
	</div>
{:else if currentMode === typeOfMode.primary}
	<Primary bind:testData />
{:else if currentMode === typeOfMode.questions}
	<Question bind:questions={testData.question_revision_ids} />
{/if}

{#if currentMode != typeOfMode.main}
	<div class="sticky bottom-0 my-4 flex w-full justify-between border-t-4 bg-white p-4">
		<Button
			variant="outline"
			class="text-primary border-primary border-1"
			onclick={() => (currentMode = typeOfMode.main)}>Cancel</Button
		>

		<Button
			class="bg-primary"
			disabled={currentMode == typeOfMode.primary &&
				(testData.name.trim() == '' || testData.description.trim() == '')}
			onclick={() => {
				currentMode < typeOfMode.settings && currentMode++;
			}}>{currentMode != typeOfMode.settings ? 'Continue' : 'Save test template'}</Button
		>
	</div>
{/if}
