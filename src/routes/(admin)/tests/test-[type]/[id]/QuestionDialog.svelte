<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import DataTable from './question_table/data-table.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	let { open = $bindable(), questions, columns, formData } = $props();
	let tags = $state<string[]>([]);
	let states = $state<string[]>([]);
	let filteredSearch: string = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;
	const data = $derived.by(() =>
		questions.map((question) => {
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
						<TagsSelection
							bind:tags
							onOpenChange={(e: boolean) => {
								if (!e) {
									const url = new URL(page.url);
									url.searchParams.delete('tag_ids');
									tags.map((tag_id: string) => {
										url.searchParams.append('tag_ids', tag_id);
									});
									goto(url, { keepFocus: true, invalidateAll: true });
								}
							}}
						/>
					</div>
					<div class="mx-2 w-1/5">
						<StateSelection
							bind:states
							onOpenChange={(e: Event) => {
								if (!e) {
									const url = new URL(page.url);
									url.searchParams.delete('state_ids');
									states.map((state_id: string) => {
										url.searchParams.append('state_ids', state_id);
									});
									goto(url, { keepFocus: true, invalidateAll: true });
								}
							}}
						/>
					</div>
					<div class="ml-auto flex w-1/5 items-start">
						<Input
							type="search"
							placeholder="Search questions..."
							bind:value={filteredSearch}
							oninput={(event) => {
								const url = new URL(page.url);
								clearTimeout(searchTimeout);
								searchTimeout = setTimeout(() => {
									url.searchParams.set('name', event?.target?.value || '');
									goto(url, { keepFocus: true, invalidateAll: true });
								}, 500);
							}}
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
