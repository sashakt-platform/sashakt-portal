<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createQuestionColumns, type Question } from './columns';
	import BatchActionsToolbar from '$lib/components/data-table/BatchActionsToolbar.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import FileUp from '@lucide/svelte/icons/file-up';
	import WhiteEmptyBox from '$lib/components/white-empty-box.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { type Filter } from '$lib/types/filters';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
	import Statlogo from '$lib/icons/StatLogo.svelte';

	const { data } = $props();
	let deleteAction: string | null = $state(null);
	let filteredTags: Filter[] = $state([]);
	let filteredStates: Filter[] = $state([]);

	let filteredTagtypes: Filter[] = $state([]);
	let searchTimeout: ReturnType<typeof setTimeout>;

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
	let noQuestionCreatedYet = $state(true);

	$effect(() => {
		// check if there are any meaningful search/filter parameters (exclude pagination params)
		const meaningfulParams = [
			'search',
			'name',
			'tag_ids',
			'state_ids',
			'tag_type_ids',
			'sortBy',
			'sortOrder'
		];
		const hasFilters = meaningfulParams.some((param) => {
			const value = page.url.searchParams.get(param);
			// Only consider it a filter if the parameter has a non-empty value
			return value && value.trim() !== '';
		});

		// also check if there are multiple tag_ids or state_ids
		const hasTagFilters = page.url.searchParams.getAll('tag_ids').length > 0;
		const hasStateFilters = page.url.searchParams.getAll('state_ids').length > 0;
		const hasTagtypeFilters = page.url.searchParams.getAll('tag_type_ids').length > 0;

		const result =
			totalItems === 0 && !hasFilters && !hasTagFilters && !hasStateFilters && !hasTagtypeFilters;

		// update the state
		noQuestionCreatedYet = result;
	});

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

	// render expanded row content
	const expandedRowContent = (question: any) => {
		return `
			<div class="flex h-fit flex-col">
				${question.options
					.map(
						(option: any) => `
					<div class="my-auto flex">
						<span class="bg-primary-foreground m-2 rounded-sm p-3">${option.key}</span>
						<p class="my-auto">${option.value}</p>
						${
							question.correct_answer.includes(option.id)
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
	title="Question Bank"
	subtitle="Manage question bank"
	showFilters={selectedQuestionIds.length === 0}
	showEmptyState={noQuestionCreatedYet}
	infoLabel="Help: Question Bank"
	infoDescription="Question Bank allows you to create, manage, and categorize questions that can be reused in multiple tests. Use filters to quickly find and organize questions by topic or difficulty."
>
	{#snippet headerActions()}
		{#if !noQuestionCreatedYet}
			{#if canCreate(data.user, 'question')}
				<a href="/questionbank/single-question/add/new"
					><Button class="font-bold" variant="outline"><Plus />Create a Question</Button></a
				>
				<a href="/questionbank/import"><Button class="font-bold"><Plus />Bulk Upload</Button></a>
			{/if}
		{/if}
	{/snippet}

	{#snippet toolbar()}
		<BatchActionsToolbar
			selectedCount={selectedQuestionIds.length}
			selectedRows={selectedQuestions}
			selectedRowIds={selectedQuestionIds}
			onAction={handleBatchAction}
			onClearSelection={handleClearSelection}
		/>
	{/snippet}

	{#snippet emptyState()}
		{#if noQuestionCreatedYet}
			<WhiteEmptyBox>
				<Statlogo />
				<h1 class="mt-4 text-3xl font-bold text-gray-800">Create your first question</h1>
				<p class="mt-4 text-gray-400">
					Click on the button to create questions to be uploaded in the test template and tests
				</p>
				{#if canCreate(data.user, 'question')}
					<div class="mt-4">
						<a href="/questionbank/single-question/add/new"
							><Button
								variant="outline"
								class="mr-4 h-12 cursor-pointer hover:bg-[#0369A1] hover:text-white"
								><Plus /> Create a Question</Button
							></a
						>
						<a href="/questionbank/import"
							><Button
								variant="outline"
								class="mr-4 h-12 cursor-pointer hover:bg-[#0369A1] hover:text-white"
							>
								<FileUp />Bulk Upload
							</Button></a
						>
					</div>
				{/if}
			</WhiteEmptyBox>
		{/if}
	{/snippet}

	{#snippet filters()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<Input
					placeholder="Search questions..."
					value={search}
					oninput={(event) => {
						const url = new URL(page.url);
						clearTimeout(searchTimeout);
						searchTimeout = setTimeout(() => {
							if (event.target?.value) {
								url.searchParams.set('search', event.target.value);
							} else {
								url.searchParams.delete('search');
							}
							url.searchParams.set('page', '1');
							goto(url, { keepFocus: true, invalidateAll: true });
						}, 300);
					}}
				/>
			</div>

			<div>
				<StateSelection bind:states={filteredStates} filteration={true} />
			</div>

			<div>
				<TagsSelection bind:tags={filteredTags} filteration={true} />
			</div>

			<div>
				<TagTypeSelection bind:tagTypes={filteredTagtypes} filteration={true} />
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
			expandable={true}
			expandColumnId="answers"
			renderExpandedRow={expandedRowContent}
			emptyStateMessage="No questions found matching your criteria."
			{enableSelection}
			onSelectionChange={handleSelectionChange}
			getRowId={(row) => row.id}
			clearSelection={clearTableSelection}
		/>
	{/snippet}
</ListingPageLayout>
