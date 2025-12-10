<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import { DataTable } from '$lib/components/data-table';
	import { createQuestionSelectionColumns } from './columns';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { QuestionForSelection } from './columns';
	import type { ColumnDef } from '@tanstack/table-core';
	import { Button } from '$lib/components/ui/button';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';

	let { open = $bindable(), questions, questionParams, formData } = $props();
	let tags = $state<string[]>([]);
	let states = $state<string[]>([]);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// let's format questions data to match QuestionForSelection interface
	const questionData: QuestionForSelection[] = $derived(
		questions.items?.map((question: any) => ({
			id: question.latest_question_revision_id,
			question_text: question.question_text,
			tags: question.tags,
			options: question.options || [],
			correct_answer: question.correct_answer || [],
			latest_question_revision_id: question.latest_question_revision_id
		})) || []
	);

	// handle sorting in dialog
	const handleSort = (columnId: string) => {
		const url = new URL(page.url);
		if (questionParams?.questionSortBy === columnId) {
			url.searchParams.set(
				'questionSortOrder',
				questionParams?.questionSortOrder === 'asc' ? 'desc' : 'asc'
			);
		} else {
			url.searchParams.set('questionSortBy', columnId);
			url.searchParams.set('questionSortOrder', 'asc');
		}
		goto(url.toString());
	};

	// now we can create columns
	const columns: ColumnDef<QuestionForSelection>[] = createQuestionSelectionColumns(
		questionParams?.questionSortBy || '',
		questionParams?.questionSortOrder || 'asc',
		handleSort
	);

	// maintain selected question data across all pages
	const initializeSelectedQuestions = () => {
		const allSelectedQuestionsMap = new Map<string, QuestionForSelection>();
		if ($formData?.question_revisions) {
			$formData.question_revisions.forEach((question: any) => {
				allSelectedQuestionsMap.set(String(question.id), question);
			});
		}
		return allSelectedQuestionsMap;
	};

	let allSelectedQuestions = $state<Map<string, QuestionForSelection>>(
		initializeSelectedQuestions()
	);

	// sync allSelectedQuestions when questions are removed on the listing page
	$effect(() => {
		if ($formData?.question_revisions) {
			// rebuild the map based on current formData
			const newMap = new Map<string, QuestionForSelection>();
			$formData.question_revisions.forEach((question: any) => {
				newMap.set(String(question.id), question);
			});
			allSelectedQuestions = newMap;
		}
	});

	const handleSelectionChange = (
		selectedRows: QuestionForSelection[],
		selectedRowIds: string[]
	) => {
		if ($formData) {
			// get current page's question IDs
			const currentPageIds = questionData.map((q) => String(q.latest_question_revision_id));

			// remove deselected items from current page only
			currentPageIds.forEach((id) => {
				if (!selectedRowIds.includes(id)) {
					allSelectedQuestions.delete(id);
				}
			});

			// add newly selected rows from current page
			selectedRows.forEach((row) => {
				allSelectedQuestions.set(String(row.latest_question_revision_id), row);
			});

			// update form data with all selected items across all pages
			$formData.question_revision_ids = Array.from(allSelectedQuestions.keys()).map((id) =>
				Number(id)
			);
			$formData.question_revisions = Array.from(allSelectedQuestions.values());
		}
	};

	// render expanded row content for question options
	const renderExpandedRow = (row: QuestionForSelection) => {
		return `
			<div class="p-4">
				${row.options
					?.map(
						(option) => `
					<div class="flex items-center my-2">
						<span class="bg-primary-foreground rounded-sm p-2 mr-3">${option.key}</span>
						<span class="mr-4">${option.value}</span>
						${
							row.correct_answer?.includes(option.id)
								? '<svg class="text-primary my-auto ml-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>'
								: ''
						}
					</div>
				`
					)
					.join('')}
			</div>
		`;
	};

	// handle selection confirmation
	const handleSelectionConfirm = () => {
		open = false;
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="max-h-[95vh] overflow-clip p-0 sm:h-[90%] sm:max-w-[95%]"
		preventScroll={false}
	>
		<div class="flex h-full flex-col">
			<Dialog.Header class="border-b-2">
				<Dialog.Title class="h-fit"
					><div class="ml-4 flex py-3 text-base sm:ml-6 sm:py-4 sm:text-xl">
						<p>Select questions from question bank</p>
						<Info class="my-auto ml-2 w-4" />
					</div></Dialog.Title
				>
			</Dialog.Header>

			<div class="m-2 flex h-full flex-col gap-4 sm:m-4 sm:gap-8">
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
					<div class="w-full lg:mr-8">
						<Input
							type="search"
							placeholder="Search questions..."
							value={questionParams?.questionSearch || ''}
							oninput={(event) => {
								const url = new URL(page.url);
								clearTimeout(searchTimeout);
								searchTimeout = setTimeout(() => {
									const target = event.target as HTMLInputElement;
									if (target?.value) {
										url.searchParams.set('questionSearch', target.value);
									} else {
										url.searchParams.delete('questionSearch');
									}
									url.searchParams.set('questionPage', '1');
									goto(url, { keepFocus: true, invalidateAll: true });
								}, 300);
							}}
						></Input>
					</div>
					<div class="w-full">
						<TagsSelection bind:tags filteration={true} />
					</div>
					<div class="w-full sm:col-span-2 lg:col-span-1">
						<StateSelection bind:states filteration={true} />
					</div>
				</div>
				<div class="relative flex flex-1 flex-col">
					<div class="overflow-auto pb-20" style="max-height: 65vh;">
						<DataTable
							data={questionData}
							{columns}
							totalItems={questions.total || 0}
							totalPages={questions.pages || 0}
							currentPage={questionParams?.questionPage || 1}
							pageSize={questionParams?.questionSize || DEFAULT_PAGE_SIZE}
							paramPrefix="question"
							expandable={true}
							{renderExpandedRow}
							expandColumnId="answers"
							emptyStateMessage="No questions found."
							enableSelection={true}
							onSelectionChange={handleSelectionChange}
							getRowId={(row) => String(row.latest_question_revision_id)}
							preSelectedIds={Array.from(allSelectedQuestions.keys())}
						/>
					</div>

					<!-- fixed bottom bar -->
					<div class="absolute right-0 bottom-0 left-0 border-t bg-white p-3 sm:p-4">
						<div
							class="flex flex-col-reverse items-center justify-between gap-2 sm:flex-row sm:gap-0"
						>
							<Button
								class="bg-primary hover:bg-primary/90 w-full sm:w-auto"
								onclick={handleSelectionConfirm}
							>
								Add to Test{$formData.is_template ? ' Template' : ''}
							</Button>

							<div class="text-muted-foreground text-sm">
								{$formData.question_revision_ids?.length || 0} question(s) selected
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
