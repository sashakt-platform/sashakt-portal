<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import { createQuestionSelectionColumns } from './columns';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { QuestionForSelection } from './columns';
	import type { ColumnDef } from '@tanstack/table-core';
	import { Button } from '$lib/components/ui/button';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { isStateAdmin, type User } from '$lib/utils/permissions.js';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let {
		open = $bindable(),
		questions,
		questionParams,
		formData,
		user = null
	}: {
		open: boolean;
		questions: any;
		questionParams: any;
		formData: any;
		user?: User | null;
	} = $props();
	let tags = $state<string[]>([]);
	let states = $state<string[]>([]);
	let selectedTagTypes = $state<{ id: string; name: string }[]>([]);
	// let's format questions data to match QuestionForSelection interface
	const questionData: QuestionForSelection[] = $derived(
		questions.items?.map((question: any) => ({
			id: question.latest_question_revision_id,
			question_text: question.question_text,
			question_type: question.question_type,
			tags: question.tags,
			options: question.options || [],
			correct_answer: question.correct_answer || [],
			latest_question_revision_id: question.latest_question_revision_id,
			instructions: question.instructions,
			marking_scheme: question.marking_scheme,
			is_mandatory: question.is_mandatory,
			media: question.media,
			matrix: question.matrix
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
			<!-- Header -->
			<Dialog.Header class="border-b px-6 py-5">
				<Dialog.Title class="text-xl font-bold text-gray-900">
					Select Questions from the {term('question_bank')}
				</Dialog.Title>
				<p class="text-primary text-sm font-medium">
					{$formData.question_revision_ids?.length || 0} of {questions.total || 0} questions selected
				</p>
			</Dialog.Header>

			<div class="flex h-full flex-col gap-4 p-4 sm:gap-6 sm:p-6">
				<!-- Filter Row -->
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
					<!-- Search -->
					<div class="sm:w-2/5">
						<SearchInput
							placeholder="Search questions"
							value={questionParams?.questionSearch || ''}
							searchParam="questionSearch"
							pageParam="questionPage"
						/>
					</div>

					<!-- Filter Dropdowns -->
					<div class="flex flex-1 flex-col gap-3 sm:flex-row">
						{#if !isStateAdmin(user)}
							<div class="flex-1">
								<StateSelection bind:states filteration={true} />
							</div>
						{/if}
						<!-- Vertical Divider -->
						<div class="hidden h-8 w-px bg-gray-200 sm:block"></div>
						<div class="flex-1">
							<TagTypeSelection bind:tagTypes={selectedTagTypes} />
						</div>
						<div class="flex-1">
							<TagsSelection bind:tags filteration={true} tagTypes={selectedTagTypes} />
						</div>
					</div>
				</div>

				<!-- Table -->
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
							emptyStateMessage="No questions found."
							enableSelection={true}
							onSelectionChange={handleSelectionChange}
							getRowId={(row) => String(row.latest_question_revision_id)}
							preSelectedIds={Array.from(allSelectedQuestions.keys())}
						/>
					</div>

					<!-- Fixed bottom bar -->
					<div class="absolute right-0 bottom-0 left-0 border-t bg-white p-3 sm:p-4">
						<div class="flex justify-center">
							<Button
								class="bg-primary hover:bg-primary/90 w-full sm:w-auto"
								onclick={handleSelectionConfirm}
							>
								Add Questions to {$formData.is_template ? 'Template' : 'Test'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
