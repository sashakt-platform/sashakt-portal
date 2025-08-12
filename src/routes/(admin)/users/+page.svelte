<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import { createColumns } from './columns';
	import Info from '@lucide/svelte/icons/info';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';

	let { data } = $props();

	const tableData = $derived(data?.users?.items || []);
	const totalItems = $derived(data?.users?.total || 0);
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
		url.searchParams.set('page', '1'); // reset to first page when sorting

		goto(url.toString(), { replaceState: false });
	}

	// create columns for the data table
	const columns = $derived(createColumns(sortBy, sortOrder, handleSort));
</script>

<div class="mx-10 flex flex-row py-4">
	<div class="my-auto flex flex-col">
		<div class=" flex w-full items-center align-middle">
			<div class="flex flex-row">
				<h2
					class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
				>
					User Management
				</h2>
				<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
			</div>
		</div>
		<Label class="my-auto align-middle text-sm font-extralight">Manage users</Label>
	</div>
	<div class="my-auto ml-auto flex gap-3 p-4">
		<a href="/users/add/new"><Button class="font-bold"><Plus />Add User</Button></a>
	</div>
</div>

<div class="mx-8 mt-10 flex flex-col gap-8">
	<DataTable
		data={tableData}
		{columns}
		{totalItems}
		{totalPages}
		{currentPage}
		{pageSize}
		{search}
	/>
</div>
