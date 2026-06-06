<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createEntityColumns, type Entity } from './entity-columns';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
	import StatusFilter from '$lib/components/StatusFilter.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import BatchActionsToolbar from '$lib/components/data-table/BatchActionsToolbar.svelte';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();

	const tableData = $derived(data?.entities?.items || []);
	const totalItems = $derived(data?.entities?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');
	const entityTypeName = $derived(data?.entityType?.name || 'Entity');

	const isActive = $derived(data?.params?.isActive || '');

	// batch selection state
	let deleteAction: string | null = $state(null);
	let selectedEntities: Entity[] = $state([]);
	let selectedEntityIds: string[] = $state([]);
	let batchDeleteMode = $state(false);
	let clearTableSelection = $state(false);

	const enableSelection = $derived(totalItems > 0);

	// handle sorting
	function handleSort(columnId: string) {
		const url = new URL(page.url);
		const newSortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';

		url.searchParams.set('sortBy', columnId);
		url.searchParams.set('sortOrder', newSortOrder);
		url.searchParams.set('page', '1');

		goto(resolve(url.pathname + url.search), { replaceState: false });
	}

	// create columns for the data table
	const columns = $derived(
		createEntityColumns(data.entityTypeId, sortBy, sortOrder, handleSort, enableSelection, {
			canEdit: canUpdate(data.user, 'entity'),
			canDelete: canDelete(data.user, 'entity')
		})
	);

	const handleSelectionChange = (selectedRows: Entity[], selectedRowIds: string[]) => {
		selectedEntities = selectedRows;
		selectedEntityIds = selectedRowIds;
	};

	const handleBatchAction = (actionId: string) => {
		if (actionId === 'delete') {
			batchDeleteMode = true;
		}
	};

	const handleBatchDeleteConfirm = () => {
		const form = document.getElementById('batch-delete-records-form') as HTMLFormElement;
		if (form) {
			form.requestSubmit();
		}
	};

	const handleBatchDeleteCancel = () => {
		batchDeleteMode = false;
	};

	const handleClearSelection = () => {
		selectedEntities = [];
		selectedEntityIds = [];
		batchDeleteMode = false;
		clearTableSelection = true;

		setTimeout(() => {
			clearTableSelection = false;
		}, 0);
	};
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName="Record"
	batchMode={batchDeleteMode}
	selectedCount={selectedEntityIds.length}
	selectedItems={selectedEntities}
	onBatchConfirm={handleBatchDeleteConfirm}
	onBatchCancel={handleBatchDeleteCancel}
/>

<form
	id="batch-delete-records-form"
	method="POST"
	action="?/batchDeleteRecords"
	style="display: none;"
	use:enhance={() => {
		return async ({ result }) => {
			batchDeleteMode = false;
			handleClearSelection();
			await invalidateAll();

			if (result.type === 'failure') {
				console.error('Batch delete records failed');
			}
		};
	}}
>
	<input type="hidden" name="entityRecordIds" value={JSON.stringify(selectedEntityIds)} />
</form>

<ListingPageLayout
	title={entityTypeName}
	subtitle=""
	backHref={resolve('/entity')}
	showFilters={selectedEntityIds.length === 0}
	tooltipKey="entity-records"
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'entity')}
			<a href={resolve(`/entity/view/${data.entityTypeId}/add/new`)}
				><Button class="font-semibold"><Plus />{`Add ${entityTypeName} Record`}</Button></a
			>
		{/if}
	{/snippet}

	{#snippet toolbar()}
		<BatchActionsToolbar
			selectedCount={selectedEntityIds.length}
			selectedRows={selectedEntities}
			selectedRowIds={selectedEntityIds}
			onAction={handleBatchAction}
			onClearSelection={handleClearSelection}
		/>
	{/snippet}

	{#snippet filters()}
		<div class="flex items-center justify-between gap-2">
			<SearchInput placeholder="Search records..." value={search} useResolve />
			<StatusFilter value={isActive} useResolve />
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
			{enableSelection}
			onSelectionChange={handleSelectionChange}
			getRowId={(row) => String(row.id)}
			clearSelection={clearTableSelection}
		/>
	{/snippet}
</ListingPageLayout>
