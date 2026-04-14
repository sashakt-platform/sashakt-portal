<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createEntityColumns } from './entity-columns';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
	import StatusFilter from '$lib/components/StatusFilter.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';

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
		createEntityColumns(data.entityTypeId, sortBy, sortOrder, handleSort, {
			canEdit: canUpdate(data.user, 'entity'),
			canDelete: canDelete(data.user, 'entity')
		})
	);
</script>

<ListingPageLayout
	title={entityTypeName}
	subtitle=""
	infoLabel="Help: Record management"
	infoDescription={`This panel displays all ${entityTypeName} records. You can edit or delete an existing record by clicking the three dots next to their entry.`}
>
	{#snippet headerActions()}
		<a href={resolve('/entity')}><Button variant="outline"><ArrowLeft />Back to Entities</Button></a
		>
		{#if canCreate(data.user, 'entity')}
			<a href={resolve(`/entity/view/${data.entityTypeId}/add/new`)}
				><Button class="font-semibold"><Plus />{`Add ${entityTypeName} Record`}</Button></a
			>
		{/if}
	{/snippet}

	{#snippet filters()}
		<div class="flex items-center justify-between gap-2">
			<SearchInput placeholder="Search records..." value={search} useResolve />
			<StatusFilter value={isActive} useResolve />
		</div>
	{/snippet}

	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
