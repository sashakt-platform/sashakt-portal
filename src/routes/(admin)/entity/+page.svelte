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
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
	import Boxes from '@lucide/svelte/icons/boxes';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import StatusFilter from '$lib/components/StatusFilter.svelte';
	import { useTerms } from '$lib/nomenclature';

	let { data } = $props();
	const term = useTerms();

	const tableData = $derived(data?.entities?.items || []);
	const totalItems = $derived(data?.entities?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');
	const isActive = $derived(data?.params?.isActive || '');

	function handleSort(columnId: string) {
		const url = new URL(page.url);
		const newSortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';

		url.searchParams.set('sortBy', columnId);
		url.searchParams.set('sortOrder', newSortOrder);
		url.searchParams.set('page', '1');

		goto(resolve(url.pathname + url.search), { replaceState: false });
	}

	const columns = $derived(
		createColumns(sortBy, sortOrder, handleSort, {
			canEdit: canUpdate(data.user, 'entity'),
			canDelete: canDelete(data.user, 'entity')
		})
	);

	const noEntitiesCreatedYet = $derived(totalItems === 0 && !search && isActive === '');
</script>

<ListingPageLayout
	title={term('entities')}
	subtitle=""
	showEmptyState={noEntitiesCreatedYet}
	tooltipKey="entity-management"
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'entity')}
			<a href={resolve('/entity/add/new')}
				><Button class="font-semibold"><Plus />Create {term('entity')}</Button></a
			>
		{/if}
	{/snippet}

	{#snippet emptyState()}
		{#if noEntitiesCreatedYet}
			<div class="mx-4 mt-4 sm:mx-8 md:mx-10">
				<div
					class="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white"
				>
					<div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-xl">
						<Boxes class="text-primary h-7 w-7" />
					</div>
					<h2 class="mt-5 text-xl font-bold text-gray-800 sm:text-2xl">
						No {term('entities', 'lower')} yet
					</h2>
					<p class="mt-2 max-w-sm text-center text-sm text-gray-400">
						Create your first {term('entity', 'lower')} to get started. {term('entities')} let you define
						custom data types to organize and manage records.
					</p>
					{#if canCreate(data.user, 'entity')}
						<div class="mt-6">
							<a href={resolve('/entity/add/new')}
								><Button class="font-semibold"><Plus />Create {term('entity')}</Button></a
							>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet filters()}
		<div class="flex items-center justify-between gap-2">
			<SearchInput
				placeholder={`Search ${term('entities', 'lower')}...`}
				value={search}
				useResolve
			/>
			<StatusFilter value={isActive} useResolve />
		</div>
	{/snippet}

	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
