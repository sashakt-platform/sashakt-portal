<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import History from '@lucide/svelte/icons/history';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Plus from '@lucide/svelte/icons/plus';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import StateSelection from '$lib/components/StateSelection.svelte';

	const { data } = $props();

	let tags = $state<string[]>([]);
	let states = $state<string[]>([]);

	$effect(() => useSidebar().setOpen(false));

	// This is a placeholder for the question bank data
	// In a real application, you would fetch this data from an API or database
</script>

<div class="w-screen">
	<div class="mx-auto flex flex-col gap-10 py-8 sm:w-[90%]">
		{#snippet snippetHeading(title: string)}
			<div class="bg-primary-foreground flex flex-row gap-3 rounded-sm px-4 py-3 align-middle">
				<Label class="text-md my-auto font-bold">{title}</Label><Info
					class="my-auto w-4 align-middle text-xs text-gray-600"
				/>
			</div>
		{/snippet}
		<div class=" flex flex-row">
			<div class="my-auto flex flex-col">
				<div class=" flex w-full items-center align-middle">
					<div class="flex flex-row">
						<h2
							class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
						>
							Create a question
						</h2>
						<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
					</div>
				</div>
				<Label class="my-auto align-middle text-sm font-extralight"
					>Add questions with tags and details</Label
				>
			</div>
			<div
				class={['text-primary my-auto ml-auto flex cursor-pointer flex-row gap-2 p-4 font-bold']}
			>
				<History />
				<p>Revision History</p>
			</div>
		</div>
		<div class="flex h-full w-full flex-row divide-x-1 bg-white p-8">
			<div class="flex w-3/5 flex-col gap-2 pr-8">
				<div class="flex flex-col gap-2">
					{@render snippetHeading('Your Question')}
					<Textarea />
					<div class="flex flex-row gap-2">
						<Checkbox /><Label class="text-sm ">Set as mandatory</Label>
					</div>
				</div>
				<div class="flex flex-col gap-4">
					{@render snippetHeading('Answers')}
					{#snippet snippetOption(option: string)}
						<div class="flex flex-row gap-4">
							<div class="bg-primary-foreground h-12 w-12 rounded-sm text-center">
								<p class="flex h-full w-full items-center justify-center text-xl font-semibold">
									{option}
								</p>
							</div>
							<div class="flex w-full flex-col gap-2">
								<div class="flex flex-row rounded-sm border-1 border-black">
									<GripVertical class="my-auto h-full  rounded-sm bg-gray-100" />
									<Input class=" border-0" />
								</div>
								<div class="flex flex-row gap-2">
									<Checkbox /><Label class="text-sm ">Set as correct answer</Label>
								</div>
							</div>
						</div>
					{/snippet}
					{@render snippetOption('A')}
					{@render snippetOption('B')}
					{@render snippetOption('C')}
					{@render snippetOption('D')}
					<div class="flex justify-end">
						<Button variant="outline" class="text-primary border-primary"><Plus />Add Answer</Button
						>
					</div>
				</div>
			</div>
			<div class="flex w-2/5 flex-col pl-8">
				<div class="flex h-1/2 flex-col gap-2">
					{@render snippetHeading('Tags')}
					<TagsSelection bind:tags />
				</div>
				<div class="flex h-1/2 flex-col gap-2">
					{@render snippetHeading('States')}
					<StateSelection bind:states />
					<div class="mt-12 flex items-center space-x-2">
						<Switch id="airplane-mode" class="bg-green-400" />
						<Label for="airplane-mode">Active</Label><Info
							class="my-auto w-4 align-middle text-xs text-gray-600"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="sticky bottom-0 my-4 flex w-full justify-between border-t-4 bg-white p-4">
		<Button variant="outline" class="text-primary border-primary border-1">Cancel</Button>

		<Button class="bg-primary">Test</Button>
	</div>
</div>
