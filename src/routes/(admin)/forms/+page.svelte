<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns } from './columns';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import Input from '$lib/components/ui/input/input.svelte';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';

	let { data } = $props();
	let searchTimeout: ReturnType<typeof setTimeout>;

	const tableData = $derived(data?.forms?.items || []);
	const totalItems = $derived(data?.forms?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');

	function handleSort(columnId: string) {
		const url = new URL(page.url);

		const newSortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('sortBy', columnId);
		url.searchParams.set('sortOrder', newSortOrder);
		url.searchParams.set('page', '1');

		goto(url.toString(), { replaceState: false });
	}

	const columns = $derived(
		createColumns(sortBy, sortOrder, handleSort, {
			canEdit: canUpdate(data.user, 'form'),
			canDelete: canDelete(data.user, 'form')
		})
	);
</script>

<ListingPageLayout
	title="Forms"
	subtitle="Create and manage dynamic forms for candidate profiles"
	infoLabel="Help: Forms"
	infoDescription="This panel displays all forms in the system. Forms are used to collect candidate information before tests. You can create, edit, or delete forms by using the actions."
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'form')}
			<a href="/forms/add/new">
				<Button class="font-bold">
					<Plus />Add Form
				</Button>
			</a>
		{/if}
	{/snippet}

	{#snippet filters()}
		<Input
			placeholder="Search forms..."
			value={search}
			oninput={(event: Event & { currentTarget: HTMLInputElement }) => {
				const value = event.currentTarget.value;
				const url = new URL(page.url);
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(() => {
					if (value) {
						url.searchParams.set('search', value);
					} else {
						url.searchParams.delete('search');
					}
					url.searchParams.set('page', '1');
					goto(url, { keepFocus: true, invalidateAll: true });
				}, 300);
			}}
			class="max-w-sm"
		/>
	{/snippet}

	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
