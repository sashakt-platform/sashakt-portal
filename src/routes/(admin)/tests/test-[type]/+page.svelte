<script lang="ts">
	import EmptyBox from '$lib/components/first-data-box.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';
	import CircleChevronLeft from '@lucide/svelte/icons/circle-chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Primary from './Primary.svelte';
	import Question from './Question.svelte';
	import Configuration from './Configuration.svelte';

	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import {
		individualTestSchema,
		testSchema,
		type FormSchema,
		type IndividualTestSchema
	} from './schema';
	import Plus from '@lucide/svelte/icons/plus';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import CopyPlus from '@lucide/svelte/icons/copy-plus';
	import FilePlus from '@lucide/svelte/icons/file-plus';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	const typeOfScreen = { main: 0, primary: 1, questions: 2, configuration: 3 };

	let currentScreen: number = $state(typeOfScreen.main);

	$effect(() =>
		currentScreen == typeOfScreen.main ? useSidebar().setOpen(true) : useSidebar().setOpen(false)
	);

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			deleteForm: SuperValidated<Infer<IndividualTestSchema>>;
			user: any;
			test_taker_url: string;
		};
	} = $props();

	const {
		form: formData,
		enhance,
		submit,
		reset
	} = superForm(data.form, {
		validators: zodClient(testSchema),
		dataType: 'json',
		onSubmit: () => {
			$formData.created_by_id = data.user.id;
		}
	});

	const {
		form: deleteFormData,
		enhance: enhanceDelete,
		submit: submitDelete
	} = superForm(data.deleteForm, {
		validators: zodClient(individualTestSchema),
		dataType: 'json'
	});

	function prepareTestFormData(testData: any, mode: 'clone' | 'update' | 'convert') {
		if (!testData || typeof testData !== 'object') {
			console.error('Invalid testData provided to prepareTestFormData');
			return;
		}
		const {
			id,
			created_date,
			modified_date,
			tags,
			states,
			question_revisions,
			is_active,
			is_deleted,
			total_questions,
			...restArray
		} = testData;
		$formData = { ...restArray };

		if (mode === 'update') {
			$formData.test_id = id;
		} else if (mode === 'clone') {
			$formData.name = `Copy of ${$formData.name}`;
			$formData.link = null;
		} else if (mode === 'convert') {
			$formData.is_template = false;
		}
		$formData.tag_ids = testData.tags?.map((tag: { id: String }) => String(tag.id)) || [];
		$formData.state_ids = testData.states?.map((state: { id: String }) => String(state.id)) || [];
		$formData.question_revision_ids =
			testData.question_revisions?.map((q: { id: number }) => q.id) || [];
	}

	function helpReset() {
		const is_template = $formData.is_template;
		reset();
		$formData.is_template = is_template;
	}
</script>

<form method="POST" action="?/save" use:enhance>
	{#if currentScreen !== typeOfScreen.main}
		<div class="flex border-b-2 py-2">
			<div class="flex justify-start">
				<Button
					variant="link"
					class=" text-gray-500"
					onclick={() => (currentScreen = typeOfScreen.main)}
					><CircleChevronLeft />Back to test {$formData.is_template
						? 'templates'
						: 'sessions'}</Button
				>
			</div>
			<div class="mx-auto flex">
				{#snippet headerNumbers(
					number: number,
					text: string,
					mode: number,
					isCompleted: boolean = false
				)}
					{@const isActive = mode === currentScreen}
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
								currentScreen = mode;
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
					typeOfScreen.primary,
					$formData.name.trim() != '' && $formData.description.trim() != ''
				)}
				<ChevronRight class="my-auto w-4" />
				{@render headerNumbers(2, 'Select Questions', typeOfScreen.questions, false)}
				<ChevronRight class="my-auto w-4" />
				{@render headerNumbers(3, 'Configuration Settings', typeOfScreen.configuration, false)}
			</div>
		</div>
	{/if}

	{#if currentScreen === typeOfScreen.main}
		<div id="mainpage" class="flex flex-col">
			<div class="mx-10 flex flex-row py-4 sm:w-[80%]">
				<div class="my-auto flex flex-col">
					<div class=" flex w-full items-center align-middle">
						<div class="flex flex-row">
							<h2
								class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
							>
								{$formData.is_template ? 'Test templates' : 'Test sessions'}
							</h2>
							<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
						</div>
					</div>
					<Label class="my-auto align-middle text-sm font-extralight"
						>{$formData.is_template
							? 'Create, edit and update all the test templates'
							: 'Create, edit,conduct and update all the test session'}</Label
					>
				</div>
				<div class="my-auto ml-auto p-4">
					{#if data.tests && data.tests.length > 0}
						<Button
							class="font-bold"
							onclick={() => ((currentScreen = typeOfScreen.primary), helpReset())}
							><Plus />{$formData.is_template
								? 'Create a test template'
								: 'Create a test session'}</Button
						>
					{/if}
				</div>
			</div>

			{#if data.tests && data.tests.length < 1}
				<EmptyBox
					title={$formData.is_template
						? 'Create your first test template'
						: 'Create your first test session'}
					subtitle={$formData.is_template
						? 'Click on create a test template to create test templates to be assigned'
						: 'Click on create a test to create tests to be conducted'}
					leftButton={{
						title: `${$formData.is_template ? 'Create Test Template' : 'Create Custom Test'}`,
						link: '#',
						click: () => {
							currentScreen = typeOfScreen.primary;
						}
					}}
					rightButton={!$formData.is_template
						? {
								title: `Create from test Template`,
								link: '/tests/test-templates',
								click: () => {
									$formData.is_template = true;
									currentScreen = typeOfScreen.main;
								}
							}
						: null}
				/>
			{:else}
				<div class="mx-8 mt-10 flex flex-col gap-8 sm:w-[80%]">
					<div class="flex flex-row gap-2">
						<div class="w-1/5">
							<TagsSelection disabled />
						</div>
						<div class="w-1/5">
							<StateSelection disabled />
						</div>
						<div class="ml-auto w-1/5">
							<Input
								disabled
								type="search"
								placeholder={$formData.is_template
									? 'Search test templates...'
									: 'Search test sessions...'}
							/>
						</div>
					</div>
					<div>
						<Table.Root>
							<Table.Header>
								<Table.Row
									class="bg-primary-foreground my-2 flex items-center rounded-lg font-extrabold  text-black"
								>
									<Table.Head class="flex w-1/12 items-center ">No.</Table.Head>
									<Table.Head class="flex w-5/12 items-center"
										>Test {$formData.is_template ? 'Template' : 'Name'}</Table.Head
									>
									<Table.Head class="flex w-3/12 items-center">Tags</Table.Head>
									<Table.Head class="flex w-2/12 items-center">Updated</Table.Head>
									<Table.Head class="flex w-1/12 items-center"></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each data.tests as test, index (test.id)}
									<Table.Row
										class=" my-2 flex items-center  rounded-lg border border-gray-200  bg-white  font-medium "
									>
										<Table.Cell class="w-1/12 items-center">{index + 1}</Table.Cell>
										<Table.Cell class="w-5/12 items-center">{test.name}</Table.Cell>
										<Table.Cell class="w-3/12 items-center">
											{#if test.tags && test.tags.length > 0}
												{test.tags.map((tag: { name: string }) => tag.name).join(', ')}
											{:else}
												None
											{/if}
										</Table.Cell>
										<Table.Cell class="w-2/12 items-center">
											{#if test.modified_date}
												{new Date(test.modified_date).toLocaleDateString('en-US', {
													day: 'numeric',
													month: 'short',
													year: 'numeric'
												})}
												{new Date(test.modified_date).toLocaleTimeString('en-US', {
													hour: 'numeric',
													minute: '2-digit',
													hour12: true
												})}
											{/if}
										</Table.Cell>
										<Table.Cell class="w-1/12 items-center">
											<!--  <Button variant="secondary" class="cursor-pointer"><Ellipsis /></Button> -->
											<DropdownMenu.Root>
												<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost' })}
													><Ellipsis /></DropdownMenu.Trigger
												>
												<DropdownMenu.Content class="w-56">
													<DropdownMenu.Group>
														<DropdownMenu.Item
															onclick={() => {
																currentScreen = typeOfScreen.primary;
																prepareTestFormData(test, 'update');
															}}
														>
															<Pencil />
															<span>Edit</span>
														</DropdownMenu.Item>
														<form action="?/delete" method="POST" use:enhanceDelete>
															<!-- <input type="hidden" name="id" value={test.id} /> -->
															<DropdownMenu.Item
																onclick={() => {
																	$deleteFormData.test_id = test.id;
																	submitDelete();
																}}
															>
																<Trash_2 />
																Delete
															</DropdownMenu.Item>
														</form>
														<DropdownMenu.Item
															onclick={() => {
																prepareTestFormData(test, 'clone');
																submit();
															}}
														>
															<CopyPlus />
															<span>Clone</span>
														</DropdownMenu.Item>
														<DropdownMenu.Item
															hidden={!test.is_template}
															onclick={() => {
																currentScreen = typeOfScreen.primary;
																prepareTestFormData(test, 'convert');
															}}
														>
															<FilePlus />
															<span>Make a Test</span>
														</DropdownMenu.Item>
														<DropdownMenu.Item
															hidden={test.is_template}
															onclick={() => {
																window.open(`${data.test_taker_url}/test/${test.link}`, '_blank');
															}}
														>
															<ExternalLink />
															<span>Conduct Test</span>
														</DropdownMenu.Item>
													</DropdownMenu.Group>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</div>
			{/if}
		</div>
	{:else if currentScreen === typeOfScreen.primary}
		<Primary {formData} />
	{:else if currentScreen === typeOfScreen.questions}
		<Question {formData} questions={data.questions} />
	{:else if currentScreen === typeOfScreen.configuration}
		<Configuration {formData} />
	{/if}

	{#if currentScreen != typeOfScreen.main}
		<div class="sticky bottom-0 my-4 flex w-full justify-between border-t-4 bg-white p-4">
			<Button
				variant="outline"
				class="text-primary border-primary border-1"
				onclick={() => (currentScreen = typeOfScreen.main)}>Cancel</Button
			>

			<Button
				class="bg-primary"
				disabled={currentScreen == typeOfScreen.primary &&
					($formData.name.trim() == '' || $formData.description.trim() == '')}
				onclick={() => {
					currentScreen == typeOfScreen.configuration
						? (submit(), (currentScreen = typeOfScreen.main))
						: currentScreen++;
					// Submit the form data
				}}
				>{currentScreen != typeOfScreen.configuration ? 'Continue' : 'Save'}
			</Button>
		</div>
	{/if}
</form>
