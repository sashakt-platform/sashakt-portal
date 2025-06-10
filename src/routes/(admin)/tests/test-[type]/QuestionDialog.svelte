<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import DataTable from './question_table/data-table.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Questions from '$lib/data/questions.json';
	import TagsSelection from './TagsSelection.svelte';
	import StateSelection from './StateSelection.svelte';
	let { open = $bindable(), data, columns, formData } = $props();
	let tags = $state<String[]>([]);
	let states = $state<String[]>([]);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class=" overflow-auto  p-0 sm:h-[90%] sm:max-w-[95%]" preventScroll={false}>
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
				<div class="flex h-1/6 flex-row">
					<div class="mx-2 w-1/5">
						<TagsSelection bind:tags disabled />
					</div>
					<div class="mx-2 w-1/5">
						<StateSelection bind:states disabled />
					</div>
					<div class="ml-auto flex w-1/5 items-start">
						<Input type="search" placeholder="Search questions..." disabled></Input>
					</div>
				</div>
				<div class="flex h-5/6 flex-col">
					<DataTable {data} {columns} bind:open {formData} />
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
