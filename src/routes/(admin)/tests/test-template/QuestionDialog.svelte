<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import DataTable from './data-table.svelte';
	import { columns } from './columns.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Questions from '$lib/data/questions.json';
	let { TagSelect, StateSelect } = $props();

	const data = Questions.map((question) => {
		return {
			id: question.id,
			question: question.question_text,
			tags: question.tags.map((tag) => tag.name),
			options: question.options.map((option) => option.text),
			answer: question.correct_answer
		};
	});
	console.log(data);
</script>

<Dialog.Root open>
	<Dialog.Content class=" p-0  sm:h-[90%] sm:max-w-[95%]">
		<div class="flex h-full flex-col">
			<Dialog.Header class="p- m-0 h-fit border-b-2">
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
						{@render TagSelect()}
					</div>
					<div class="mx-2 w-1/5">
						{@render StateSelect()}
					</div>
					<div class="ml-auto flex w-1/5 items-start">
						<Input type="search" placeholder="Search questions..."></Input>
					</div>
				</div>
				<div class="h-5/6"><DataTable {data} {columns} /></div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
