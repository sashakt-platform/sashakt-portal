<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns, type User } from './columns';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import { useTerms } from '$lib/nomenclature';
	import BatchActionsToolbar from '$lib/components/data-table/BatchActionsToolbar.svelte';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();
	const term = useTerms();

	const tableData = $derived(data?.users?.items || []);
	const totalItems = $derived(data?.users?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');

	// batch selection state
	let deleteAction: string | null = $state(null);
	let selectedUsers: User[] = $state([]);
	let selectedUserIds: string[] = $state([]);
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

		goto(url.toString(), { replaceState: false });
	}

	const columns = $derived(
		createColumns(sortBy, sortOrder, handleSort, enableSelection, {
			canEdit: canUpdate(data.user, 'user'),
			canDelete: canDelete(data.user, 'user')
		})
	);

	const handleSelectionChange = (selectedRows: User[], selectedRowIds: string[]) => {
		selectedUsers = selectedRows;
		selectedUserIds = selectedRowIds;
	};

	const handleBatchAction = (actionId: string) => {
		if (actionId === 'delete') {
			batchDeleteMode = true;
		}
	};

	const handleBatchDeleteConfirm = () => {
		const form = document.getElementById('batch-delete-users-form') as HTMLFormElement;
		if (form) {
			form.requestSubmit();
		}
	};

	const handleBatchDeleteCancel = () => {
		batchDeleteMode = false;
	};

	const handleClearSelection = () => {
		selectedUsers = [];
		selectedUserIds = [];
		batchDeleteMode = false;
		clearTableSelection = true;

		setTimeout(() => {
			clearTableSelection = false;
		}, 0);
	};
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName="User"
	batchMode={batchDeleteMode}
	selectedCount={selectedUserIds.length}
	selectedItems={selectedUsers}
	onBatchConfirm={handleBatchDeleteConfirm}
	onBatchCancel={handleBatchDeleteCancel}
/>

<form
	id="batch-delete-users-form"
	method="POST"
	action="?/batchDelete"
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
	<input type="hidden" name="userIds" value={JSON.stringify(selectedUserIds)} />
</form>

<ListingPageLayout
	title={term('users')}
	subtitle=""
	showFilters={selectedUserIds.length === 0}
	tooltipKey="users"
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'user')}
			<a href={resolve('/users/add/new')}
				><Button class="font-semibold"><Plus />Create {term('user')}</Button></a
			>
		{/if}
	{/snippet}

	{#snippet toolbar()}
		<BatchActionsToolbar
			selectedCount={selectedUserIds.length}
			selectedRows={selectedUsers}
			selectedRowIds={selectedUserIds}
			onAction={handleBatchAction}
			onClearSelection={handleClearSelection}
		/>
	{/snippet}

	{#snippet filters()}
		<SearchInput placeholder={`Search ${term('users', 'lower')}...`} value={search} />
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
