<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns } from './columns';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import Input from '$lib/components/ui/input/input.svelte';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';

	let { data } = $props();
	let searchTimeout: ReturnType<typeof setTimeout>;

	const tableData = $derived(data?.entities?.items || []);
	const totalItems = $derived(data?.entities?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');

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
		createColumns(sortBy, sortOrder, handleSort, {
			canEdit: canUpdate(data.user, 'entity'),
			canDelete: canDelete(data.user, 'entity')
		})
	);
</script>

<ListingPageLayout
	title="Entities"
	subtitle="Manage entities"
	infoLabel="Help: Entity management"
	infoDescription="This panel displays all entities in the system. You can view records, edit or delete an entity by clicking the three dots next to their entry."
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'entity')}
			<a href={resolve('/entity/add/new')}><Button class="font-bold"><Plus />Add Entity</Button></a>
		{/if}
	{/snippet}

	{#snippet filters()}
		<Input
			placeholder="Search entities..."
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
					goto(resolve(url.pathname + url.search), { keepFocus: true, invalidateAll: true });
				}, 300);
			}}
			class="max-w-sm"
		/>
	{/snippet}

	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
