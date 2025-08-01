<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import DataTable from './question_table/data-table.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	let { open = $bindable(), questions, columns, formData } = $props();
	let tags = $state<string[]>([]);
	let states = $state<string[]>([]);
	let filteredSearch: string = $state('');
	const data = $derived.by(() =>
		questions.items
			.filter((question) => {
				// Tag filter (if any tags are selected)
				if (tags.length > 0) {
					const hasMatchingTag = question.tags?.some((tag: any) => tags.includes(String(tag.id)));
					if (!hasMatchingTag) return false;
				}

				// State filter (if any states are selected)
				if (states.length > 0) {
					const hasMatchingState = question.locations?.some((location: any) =>
						states.includes(String(location.state_id))
					);
					if (!hasMatchingState) return false;
				}

				// Search filter (if search text is provided)
				if (filteredSearch.length > 0) {
					const matchesSearch = question.question_text
						?.toLowerCase()
						.includes(filteredSearch.toLowerCase());
					if (!matchesSearch) return false;
				}

				return true;
			})
			.map((question) => {
				return {
					id: question.latest_question_revision_id,
					question: question.question_text,
					tags: question.tags?.map((tag) => tag.name),
					options: question.options?.map((option) => {
						return option;
					}),
					answer: question.correct_answer
				};
			})
	);
</script>

<Dialog.Root bind:open>
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
					<DataTable {data} {columns} bind:open {formData} />
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
