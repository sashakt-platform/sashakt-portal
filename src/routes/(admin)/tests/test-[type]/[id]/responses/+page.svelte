<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { DataTable } from '$lib/components/data-table/index.js';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import BatchActionsToolbar from '$lib/components/data-table/BatchActionsToolbar.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import FormResponsesDialog from './FormResponsesDialog.svelte';
	import { createResponseColumns, type CandidateResponse } from './columns.js';
	import { hasPermission, PERMISSIONS } from '$lib/utils/permissions.js';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/button/button.svelte';
	import Download from '@lucide/svelte/icons/download';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const tableData = $derived(data?.responses?.items || []);
	const totalItems = $derived(data?.responses?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');
	const search = $derived(data?.params?.search || '');

	const userCanDelete = $derived(hasPermission(data.user, PERMISSIONS.DELETE_CANDIDATE));

	const exportHref = $derived(
		`${page.url.pathname}/export?sortBy=${encodeURIComponent(sortBy)}&sortOrder=${encodeURIComponent(sortOrder)}`
	);

	let deleteAction: string | null = $state(null);

	let showResponsesOpen = $state(false);
	let selectedFormResponse: Record<string, string | null> | null = $state(null);

	// batch selection state
	let selectedCandidates: CandidateResponse[] = $state([]);
	let selectedCandidateIds: string[] = $state([]);
	let batchDeleteMode = $state(false);
	let clearTableSelection = $state(false);

	function handleDelete(candidateId: number) {
		deleteAction = `?/deleteCandidate&candidate_id=${candidateId}`;
	}

	function handleShowResponses(candidate: CandidateResponse) {
		selectedFormResponse = candidate.form_response ?? null;
		showResponsesOpen = true;
	}

	let downloadingCandidateIds = $state(new Set<number>());

	async function handleDownloadCertificate(
		candidateId: number,
		certificateDownloadUrl: string,
		candidateUuid: string
	) {
		downloadingCandidateIds = new Set([...downloadingCandidateIds, candidateId]);
		try {
			const response = await fetch('/api/download-certificate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ certificate_download_url: certificateDownloadUrl })
			});

			if (!response.ok) throw new Error('Download failed');

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `certificate-${candidateUuid}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to download certificate:', error);
			toast.error('Failed to download certificate');
		} finally {
			downloadingCandidateIds = new Set([...downloadingCandidateIds].filter((id) => id !== candidateId));
		}
	}

	// handle sorting
	function handleSort(columnId: string) {
		const url = new URL(page.url);
		const newSortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';

		url.searchParams.set('sortBy', columnId);
		url.searchParams.set('sortOrder', newSortOrder);
		url.searchParams.set('page', '1');

		goto(url.toString(), { replaceState: false });
	}

	const columns = $derived(
		createResponseColumns(
			sortBy,
			sortOrder,
			handleSort,
			handleDelete,
			userCanDelete,
			userCanDelete,
			handleShowResponses,
			downloadingCandidateIds,
			handleDownloadCertificate
		)
	);

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

<FormResponsesDialog bind:open={showResponsesOpen} formResponse={selectedFormResponse} />

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
	{#snippet headerActions()}
		{#if totalItems > 0}
			<Button
				href={resolve(exportHref as any)}
				download
				variant="outline"
				class="border-primary text-primary bg-card font-semibold"
			>
				<Download class="h-4 w-4" />
				Export
			</Button>
		{/if}
	{/snippet}

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

	{#snippet filters()}
		<SearchInput placeholder="Search candidates..." value={search} />
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
