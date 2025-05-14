<script lang="ts">
	import EmptyBox from '$lib/components/first-data-box.svelte';
	import WhiteEmptyBox from '$lib/components/white-empty-box.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import TagList from '$lib/data/tags.json';
	import StateList from '$lib/data/states.json';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { render } from 'svelte/server';
	import {useSidebar} from '$lib/components/ui/sidebar/index.js'
	import Sidebar from '$lib/components/ui/sidebar/sidebar.svelte';
	let mode: 'main' | 'primary' | 'questions' | 'settings' = $state('primary');

	let tags = $state<string[]>([]);
	let states = $state<string[]>([]);



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
				<!-- <Input type='text' id="template-name" placeholder="Enter the test description here..." class="h-12" /> -->
				<Textarea placeholder="Enter the test description here..." />
			</div>

			<div class="flex">
				<div class="mt-10 mr-24 w-1/2">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">Tags</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>

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
				</div>

				<div class="mt-10 w-1/2">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">States</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>
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
				</div>
			</div>
		</div>
	</WhiteEmptyBox>
{/if}
