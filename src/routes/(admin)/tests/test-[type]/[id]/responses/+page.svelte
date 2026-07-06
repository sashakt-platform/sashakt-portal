<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { DataTable } from '$lib/components/data-table/index.js';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import BatchActionsToolbar from '$lib/components/data-table/BatchActionsToolbar.svelte';
	import { createResponseColumns, type CandidateResponse } from './columns.js';
	import { hasPermission, PERMISSIONS } from '$lib/utils/permissions.js';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	const tableData = $derived(data?.responses?.items || []);
	const totalItems = $derived(data?.responses?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);

	const userCanDelete = $derived(hasPermission(data.user, PERMISSIONS.DELETE_CANDIDATE));

	let deleteAction: string | null = $state(null);

	// batch selection state
	let selectedCandidates: CandidateResponse[] = $state([]);
	let selectedCandidateIds: string[] = $state([]);
	let batchDeleteMode = $state(false);
	let clearTableSelection = $state(false);

	function handleDelete(candidateId: number) {
		deleteAction = `?/deleteCandidate&candidate_id=${candidateId}`;
	}

	const columns = $derived(createResponseColumns(handleDelete, userCanDelete, userCanDelete));

	const handleSelectionChange = (selectedRows: CandidateResponse[], selectedRowIds: string[]) => {
		selectedCandidates = selectedRows;
		selectedCandidateIds = selectedRowIds;
	};

	const handleBatchAction = (actionId: string) => {
		if (actionId === 'delete') batchDeleteMode = true;
	};

	const handleBatchDeleteConfirm = () => {
		const form = document.getElementById('batch-delete-form') as HTMLFormElement;
		form?.requestSubmit();
	};

	const handleBatchDeleteCancel = () => {
		batchDeleteMode = false;
	};

	const handleClearSelection = () => {
		selectedCandidates = [];
		selectedCandidateIds = [];
		batchDeleteMode = false;
		clearTableSelection = true;
		setTimeout(() => {
			clearTableSelection = false;
		}, 0);
	};
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName="Candidate"
	batchMode={batchDeleteMode}
	selectedCount={selectedCandidateIds.length}
	selectedItems={selectedCandidates}
	onBatchConfirm={handleBatchDeleteConfirm}
	onBatchCancel={handleBatchDeleteCancel}
/>

<form
	id="batch-delete-form"
	method="POST"
	action="?/batchDeleteCandidates"
	style="display: none;"
	use:enhance={() => {
		return async ({ result }) => {
			batchDeleteMode = false;
			handleClearSelection();
			await invalidateAll();
			if (result.type === 'failure') {
				console.error('Batch delete failed');
			}
		};
	}}
>
	<input type="hidden" name="candidateIds" value={JSON.stringify(selectedCandidateIds)} />
</form>

<ListingPageLayout
	title={data.testName}
	subtitle=""
	backHref="/tests/test-session"
	showInfoIcon={false}
>
	{#snippet toolbar()}
		{#if userCanDelete}
			<BatchActionsToolbar
				selectedCount={selectedCandidateIds.length}
				selectedRows={selectedCandidates}
				selectedRowIds={selectedCandidateIds}
				entityLabel="candidate"
				onAction={handleBatchAction}
				onClearSelection={handleClearSelection}
			/>
		{/if}
	{/snippet}

	{#snippet content()}
		<DataTable
			{columns}
			data={tableData}
			{totalItems}
			{totalPages}
			{currentPage}
			{pageSize}
			emptyStateMessage="No responses found."
			enableSelection={userCanDelete}
			onSelectionChange={handleSelectionChange}
			getRowId={(row) => String(row.candidate_id)}
			clearSelection={clearTableSelection}
		/>
	{/snippet}
</ListingPageLayout>
