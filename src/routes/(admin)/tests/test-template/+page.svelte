<script lang="ts">
	import EmptyBox from '$lib/components/first-data-box.svelte';
	import WhiteEmptyBox from '$lib/components/white-empty-box.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import TagList from '$lib/data/tags.json';
	import StateList from '$lib/data/states.json';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';

	import Button from '$lib/components/ui/button/button.svelte';

	import QuestionDialog from './QuestionDialog.svelte';
	type modes = 'main' | 'primary' | 'questions' | 'settings';
	let mode: modes = $state('primary');
	$effect(() => (mode == 'main' ? useSidebar().setOpen(true) : useSidebar().setOpen(false)));

	let tags = $state<string[]>([]);
	let states = $state<string[]>([]);
	let dialogOpen = $state(false);

	const selectedTags = $derived(
		tags.length
			? TagList.filter((tag) => tags.includes(String(tag.id))).map((tag) => tag.name)
			: 'Select relevant tags'
	);

	const selectedStates = $derived(
		states.length
			? StateList.filter((state) => states.includes(String(state.id))).map((state) => state.name)
			: 'Select relevant states'
	);
</script>

{#snippet myBadge(children: any)}
	<Badge variant="default" style={'background-color:#3587B4'} class="m-1 rounded-sm  p-2"
		>{children}</Badge
	>
{/snippet}

{#snippet TagSelect()}
	<Select.Root type="multiple" bind:value={tags}>
		<Select.Trigger>
			{#if tags.length === 0}
				{selectedTags}
			{:else}
				<span class="truncate text-start">
					{#each selectedTags as tag}
						{@render myBadge(tag)}
					{/each}
				</span>
			{/if}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.GroupHeading>Select Relavant Tags</Select.GroupHeading>
				{#each TagList as tag}
					<Select.Item value={String(tag.id)} label={tag.name} />
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
{/snippet}

{#snippet StateSelect()}
	<Select.Root type="multiple" bind:value={states}>
		<Select.Trigger>
			{#if states.length === 0}
				{selectedStates}
			{:else}
				<span class="truncate text-start">
					{#each selectedStates as state}
						{@render myBadge(state)}
					{/each}
				</span>
			{/if}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.GroupHeading>Select Relavant States</Select.GroupHeading>
				{#each StateList as state}
					<Select.Item value={String(state.id)} label={state.name} />
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
{/snippet}

<QuestionDialog open={dialogOpen} {TagSelect} {StateSelect} />

{#if mode !== 'main'}
<div class='flex'>
	<Button variant='link'>Back to test templates</Button>
</div>
{/if}

{#if mode === 'main'}
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
					mode = 'primary';
				}
			}}
			rightButton={null}
		/>
	</div>
{:else if mode === 'primary'}
	<WhiteEmptyBox>
		<div class="h-full w-full text-left">
			<div>
				<div class="flex align-middle">
					<Label for="template-name" class="text-2xl">Test template name</Label><span
						><Info class=" m-2  w-4 text-xs text-gray-600" /></span
					>
				</div>
				<Input type="text" id="template-name" placeholder="Enter the test name" class="h-12" />
				<span class="text-xs text-gray-500"
					>Enter a unique test name to differentiate from the other tests</span
				>
			</div>

			<div class="mt-10">
				<div class="flex align-middle">
					<Label for="template-name" class="text-2xl">Description</Label><span
						><Info class=" m-2  w-4 text-xs text-gray-600" /></span
					>
				</div>
				<Textarea placeholder="Enter the test description here..." />
			</div>

			<div class="flex">
				<div class="mt-10 mr-24 w-1/2">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">Tags</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>
					{@render TagSelect()}
				</div>

				<div class="mt-10 w-1/2">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">States</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>
					{@render StateSelect()}
				</div>
			</div>
		</div>
	</WhiteEmptyBox>
{:else if mode === 'questions'}
	<div class="mx-auto flex h-dvh">
		<div class="ml-20 w-3/4 p-20">
			<div
				class=" mb-2 flex h-1/6 items-center rounded-t-xl rounded-b-sm border bg-white p-4 shadow-lg"
			>
				<div class="mr-4 flex h-full items-center">
					<svg
						width="48"
						height="48"
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class=""
					>
						<circle cx="24" cy="24" r="24" fill="#F0F9FF" />
						<mask
							id="mask0_429_9071"
							style="mask-type:alpha"
							maskUnits="userSpaceOnUse"
							x="10"
							y="10"
							width="28"
							height="28"
						>
							<rect x="10" y="10" width="28" height="28" fill="#D9D9D9" />
						</mask>
						<g mask="url(#mask0_429_9071)">
							<path
								d="M18.4575 29.5423H26.0409V27.7923H18.4575V29.5423ZM18.4575 24.8757H29.5409V23.1257H18.4575V24.8757ZM18.4575 20.209H29.5409V18.459H18.4575V20.209ZM16.1916 33.9173C15.6022 33.9173 15.1034 33.7132 14.695 33.3048C14.2867 32.8965 14.0825 32.3976 14.0825 31.8083V16.193C14.0825 15.6037 14.2867 15.1048 14.695 14.6965C15.1034 14.2882 15.6022 14.084 16.1916 14.084H31.8068C32.3962 14.084 32.895 14.2882 33.3034 14.6965C33.7117 15.1048 33.9159 15.6037 33.9159 16.193V31.8083C33.9159 32.3976 33.7117 32.8965 33.3034 33.3048C32.895 33.7132 32.3962 33.9173 31.8068 33.9173H16.1916ZM16.1916 32.1673H31.8068C31.8966 32.1673 31.9789 32.1299 32.0536 32.055C32.1284 31.9804 32.1659 31.8981 32.1659 31.8083V16.193C32.1659 16.1032 32.1284 16.0209 32.0536 15.9463C31.9789 15.8714 31.8966 15.834 31.8068 15.834H16.1916C16.1017 15.834 16.0195 15.8714 15.9448 15.9463C15.87 16.0209 15.8325 16.1032 15.8325 16.193V31.8083C15.8325 31.8981 15.87 31.9804 15.9448 32.055C16.0195 32.1299 16.1017 32.1673 16.1916 32.1673Z"
								fill="#0369A1"
							/>
						</g>
					</svg>
				</div>
				<div class="flex h-full w-full flex-col">
					<div class="flex">
						<p class="font-bold">Sashakt Sample Test</p>
						<PenLine class="p-1" />
					</div>
					<div class="flex flex-row items-center text-sm">
						<span class=" my-4 mr-4 rounded-sm bg-[#E8F1F7] p-1 px-2 font-bold">Test Template</span>
						<span class="text-gray-500">0 questions (0pts)</span>
					</div>
				</div>
			</div>
			<div
				class="my-auto flex h-5/6 justify-center rounded-t-sm rounded-b-xl border bg-white p-4 shadow-lg"
			>
				<div class="my-auto text-center">
					<p class="text-lg font-bold">Shortlist your Questions</p>
					<p class="text-sm text-gray-400">Add the relevant questions to your test template</p>
					<Button class="mt-6 bg-[#0369A1]" onclick={() => (dialogOpen = true)}
						>Select from question bank</Button
					>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if mode != 'main'}
	<div class="sticky bottom-0 my-4 flex w-full justify-between border-t-4 bg-white p-4">
		<Button variant="outline" onclick={() => (mode = 'main')}>Cancel</Button>
		<Button
			class="bg-primary"
			onclick={() => {
				if (mode === 'primary') {
					mode = 'questions';
				} else if (mode === 'questions') {
					dialogOpen = true;
				}
			}}>Continue</Button
		>
	</div>
{/if}
