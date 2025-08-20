<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import DataTable from './question_table/data-table.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	interface Questions {
		items: [];
		page: number;
		pages: number;
		size: number;
		total: number;
	}
	let {
		open = $bindable(),
		rowSelection = $bindable(),
		questions,
		isTemplate
	}: { questions: Questions; isTemplate: boolean } = $props();
	let tags = $state<string[]>([]);
	let states = $state<string[]>([]);
	let filteredSearch: string = $state('');
</script>

<Dialog.Root
	bind:open
	onOpenChangeComplete={(v) => {
		const url = new URL(page.url);
		url.searchParams.delete('question_page');
		goto(url, { keepFocus: true, invalidateAll: true });
	}}
>
	<Dialog.Content class="overflow-clip  p-0 sm:h-[90%] sm:max-w-[95%]" preventScroll={false}>
		<div class="flex h-full flex-col">
			<Dialog.Header class="  border-b-2 ">
				<Dialog.Title class="h-fit"
					><div class="ml-6 flex py-4 text-xl">
						<p>Select questions from question bank</p>
						<Info class="my-auto ml-2 w-4" />
					</div></Dialog.Title
				>
			</Dialog.Header>

			<div class="m-4 h-full">
				<div class="flex h-1/12 flex-row">
					<div class="mx-2 w-1/5">
						<TagsSelection bind:tags />
					</div>
					<div class="mx-2 w-1/5">
						<StateSelection bind:states />
					</div>
					<div class="ml-auto flex w-1/5 items-start">
						<Input type="search" placeholder="Search questions..." bind:value={filteredSearch}
						></Input>
					</div>
				</div>
				<div class="flex h-11/12 flex-col">
					<DataTable data={questions} bind:open bind:rowSelection {isTemplate} />
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
