<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createQuestionColumns, type Question } from './columns';
	import BatchActionsToolbar from '$lib/components/data-table/BatchActionsToolbar.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Upload from '@lucide/svelte/icons/upload';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { type Filter } from '$lib/types/filters';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { canCreate, canUpdate, canDelete, hasLocation } from '$lib/utils/permissions.js';
	import { useTerms } from '$lib/nomenclature';

	const { data } = $props();
	const term = useTerms();
	let deleteAction: string | null = $state(null);
	let filteredTags: Filter[] = $state([]);
	let filteredStates: Filter[] = $state([]);

	let filteredTagtypes: Filter[] = $state([]);

	// batch selection state
	let selectedQuestions: Question[] = $state([]);
	let selectedQuestionIds: string[] = $state([]);
	let batchDeleteMode = $state(false);
	let clearTableSelection = $state(false);

	// extract data and pagination info
	const tableData = $derived(data?.questions?.items || []);
	const totalItems = $derived(data?.questions?.total || 0);

	const totalPages = $derived(data?.questions?.pages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');
	const hasActiveFilters = $derived(
		search ||
			page.url.searchParams.getAll('tag_ids').length > 0 ||
			page.url.searchParams.getAll('state_ids').length > 0 ||
			page.url.searchParams.getAll('tag_type_ids').length > 0
	);
	const noQuestionCreatedYet = $derived(totalItems === 0 && !hasActiveFilters);

	// handle sorting
	const handleSort = (columnId: string) => {
		const url = new URL(page.url);
		const newSortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';

		url.searchParams.set('sortBy', columnId);
		url.searchParams.set('sortOrder', newSortOrder);
		url.searchParams.set('page', '1');

		goto(url.toString(), { replaceState: false });
	};

	// enable selection
	const enableSelection = $derived(!noQuestionCreatedYet);
	// create question columns
	const columns = $derived(
		createQuestionColumns(sortBy, sortOrder, handleSort, enableSelection, {
			canEdit: canUpdate(data.user, 'question'),
			canDelete: canDelete(data.user, 'question')
		})
	);

	// handle selection change
	const handleSelectionChange = (selectedRows: Question[], selectedRowIds: string[]) => {
		selectedQuestions = selectedRows;
		selectedQuestionIds = selectedRowIds;
	};

	// handle batch actions
	const handleBatchAction = (actionId: string) => {
		switch (actionId) {
			case 'delete':
				batchDeleteMode = true;
				break;
		}
	};

	// handle batch delete confirmation
	const handleBatchDeleteConfirm = () => {
		// submit the hidden form which will trigger the server action
		const form = document.getElementById('batch-delete-form') as HTMLFormElement;
		if (form) {
			form.requestSubmit();
		}
	};

	// handle batch delete cancellation
	const handleBatchDeleteCancel = () => {
		batchDeleteMode = false;
	};

	// clear selection
	const handleClearSelection = () => {
		selectedQuestions = [];
		selectedQuestionIds = [];
		batchDeleteMode = false;
		clearTableSelection = true;

		// reset the flag after a brief delay
		setTimeout(() => {
			clearTableSelection = false;
		}, 0);
	};
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName="Question"
	batchMode={batchDeleteMode}
	selectedCount={selectedQuestionIds.length}
	selectedItems={selectedQuestions}
	onBatchConfirm={handleBatchDeleteConfirm}
	onBatchCancel={handleBatchDeleteCancel}
/>

<form
	id="batch-delete-form"
	method="POST"
	action="?/batchDelete"
	style="display: none;"
	use:enhance={() => {
		return async ({ result }) => {
			batchDeleteMode = false;
			handleClearSelection();

			// invalidate all data to refresh the page and show flash messages
			await invalidateAll();

			if (result.type === 'failure') {
				console.error('Batch delete failed');
			}
		};
	}}
>
	<input type="hidden" name="questionIds" value={JSON.stringify(selectedQuestionIds)} />
</form>

<ListingPageLayout
	title={term('question_bank')}
	subtitle=""
	showFilters={selectedQuestionIds.length === 0}
	showEmptyState={noQuestionCreatedYet}
	tooltipKey="question-bank"
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'question')}
			<a href={resolve('/questionbank/single-question/add/new')}
				><Button
					class="border-primary text-primary hover:bg-primary/5 bg-card font-semibold"
					variant="outline"><Plus class="h-4 w-4" />Create Question</Button
				></a
			>
			<a href={resolve('/questionbank/import')}
				><Button class="font-semibold"><Plus class="h-4 w-4" />Bulk Upload</Button></a
			>
		{/if}
	{/snippet}

	{#snippet toolbar()}
		<BatchActionsToolbar
			selectedCount={selectedQuestionIds.length}
			selectedRows={selectedQuestions}
			selectedRowIds={selectedQuestionIds}
			entityLabel="question"
			onAction={handleBatchAction}
			onClearSelection={handleClearSelection}
		/>
	{/snippet}

	{#snippet emptyState()}
		{#if noQuestionCreatedYet}
			<div class="mx-4 mt-4 sm:mx-8 md:mx-10">
				<div
					class="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card"
				>
					<h2 class="text-xl font-bold text-foreground sm:text-2xl">Create your first question</h2>
					<p class="mt-2 text-sm text-subtle-foreground">Choose a method to get started</p>

					{#if canCreate(data.user, 'question')}
						<div class="mt-8 flex flex-col gap-6 sm:flex-row">
							<a
								href={resolve('/questionbank/single-question/add/new')}
								class="hover:border-primary hover:bg-primary/5 flex w-64 flex-col items-center rounded-xl border-2 border-dashed border-border px-8 py-10 transition-colors"
							>
								<div class="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-xl">
									<Upload class="text-primary h-6 w-6" />
								</div>
								<h3 class="mt-5 text-center text-base font-semibold text-foreground">
									Create Question
								</h3>
								<p class="mt-1 text-center text-sm text-subtle-foreground">Create questions from scratch.</p>
							</a>

							<a
								href={resolve('/questionbank/import')}
								class="hover:border-primary hover:bg-primary/5 flex w-64 flex-col items-center rounded-xl border-2 border-dashed border-border px-8 py-10 transition-colors"
							>
								<div class="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-xl">
									<FileSpreadsheet class="text-primary h-6 w-6" />
								</div>
								<h3 class="mt-5 text-center text-base font-semibold text-foreground">Bulk Upload</h3>
								<p class="mt-1 text-center text-sm text-subtle-foreground">
									Upload multiple questions at once.
								</p>
							</a>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet filters()}
		<div class="flex flex-col gap-4 lg:flex-row lg:items-start">
			<SearchInput placeholder="Search questions" value={search} />

			<div class="flex flex-1 flex-wrap items-start justify-end gap-2">
				{#if !hasLocation(data.user)}
					<div>
						<StateSelection bind:states={filteredStates} filteration={true} />
					</div>
					<div class="mx-4 w-px self-stretch bg-gray-300"></div>
				{/if}

				<div>
					<TagTypeSelection bind:tagTypes={filteredTagtypes} filteration={true} />
				</div>

				<div>
					<TagsSelection bind:tags={filteredTags} filteration={true} tagTypes={filteredTagtypes} />
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet content()}
		<DataTable
			data={tableData}
			{columns}
			{totalItems}
			{totalPages}
			{currentPage}
			{pageSize}
			emptyStateMessage="No questions found matching your criteria."
			{enableSelection}
			onSelectionChange={handleSelectionChange}
			getRowId={(row) => row.id}
			clearSelection={clearTableSelection}
		/>
	{/snippet}
</ListingPageLayout>
